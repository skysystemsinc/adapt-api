import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import { encryptBuffer } from 'src/common/utils/helper.utils';
import { SettingRequest, SettingRequestStatus, SettingRequestAction } from '../entities/setting-request.entity';
import { Setting } from '../entities/setting.entity';
import { CreateSettingRequestDto } from '../dto/create-setting-request.dto';
import { ReviewSettingRequestDto } from '../dto/review-setting-request.dto';
import { SettingRequestResponseDto } from '../dto/setting-request-response.dto';
import { QuerySettingRequestsDto } from '../dto/query-setting-requests.dto';
import { SettingsService } from '../settings.service';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SETTINGS_UPLOAD_DIR = 'uploads/settings';
const FILE_MIME_TYPE_MAP: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

@Injectable()
export class SettingRequestsService {
  private readonly logger = new Logger(SettingRequestsService.name);

  constructor(
    @InjectRepository(SettingRequest)
    private readonly settingRequestRepository: Repository<SettingRequest>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    private readonly settingsService: SettingsService,
    private readonly dataSource: DataSource,
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(SETTINGS_UPLOAD_DIR);
    } catch {
      await fs.mkdir(SETTINGS_UPLOAD_DIR, { recursive: true });
      this.logger.log(`📁 Created upload directory: ${SETTINGS_UPLOAD_DIR}`);
    }
  }

  private async detectMimeType(buffer: Buffer, fileExtension?: string): Promise<string> {
    try {
      const fileType = await fileTypeFromBuffer(buffer);
      if (fileType) {
        return fileType.mime;
      }
    } catch (error) {
      this.logger.warn('Failed to detect MIME type from buffer', error);
    }

    // Fallback to extension-based MIME type
    if (fileExtension) {
      const mimeTypes = FILE_MIME_TYPE_MAP[fileExtension.toLowerCase()];
      if (mimeTypes && mimeTypes.length > 0) {
        return mimeTypes[0];
      }
    }

    return 'application/octet-stream';
  }

  /**
   * Create a setting request for approval
   */
  async create(
    createDto: CreateSettingRequestDto,
    requestedBy?: string,
  ): Promise<SettingRequestResponseDto> {
    const isNewSetting = !createDto.settingId;
    let setting: Setting | null = null;

    // Validate existing setting for UPDATE / DELETE
    if (!isNewSetting && createDto.settingId) {
      setting = await this.settingRepository.findOne({
        where: { id: createDto.settingId },
      });

      if (!setting) {
        throw new NotFoundException(
          `Setting with ID '${createDto.settingId}' not found`,
        );
      }

      // Prevent multiple pending requests for same setting
      const pendingRequest = await this.settingRequestRepository.findOne({
        where: {
          settingId: createDto.settingId,
          status: SettingRequestStatus.PENDING,
        },
      });

      if (pendingRequest) {
        throw new BadRequestException(
          'This setting already has a pending request. Please resolve it first.',
        );
      }
    }

    // Determine action
    let action: SettingRequestAction;
    if (createDto.action) {
      action = createDto.action;
    } else if (isNewSetting) {
      action = SettingRequestAction.CREATE;
    } else {
      action = SettingRequestAction.UPDATE;
    }

    // DELETE requires settingId
    if (action === SettingRequestAction.DELETE && !createDto.settingId) {
      throw new BadRequestException('settingId is required for DELETE action');
    }

    // CREATE validations
    if (action === SettingRequestAction.CREATE) {
      if (!createDto.key) {
        throw new BadRequestException('key is required for CREATE action');
      }

      const existingSetting = await this.settingRepository.findOne({
        where: { key: createDto.key },
      });

      if (existingSetting) {
        throw new BadRequestException(
          `Setting with key "${createDto.key}" already exists`,
        );
      }

      const pendingCreateRequest =
        await this.settingRequestRepository.findOne({
          where: {
            key: createDto.key,
            status: SettingRequestStatus.PENDING,
            action: SettingRequestAction.CREATE,
          },
        });

      if (pendingCreateRequest) {
        throw new BadRequestException(
          `A pending CREATE request already exists for key "${createDto.key}"`,
        );
      }
    }

    // Prepare value fields
    let value = createDto.value ?? '';
    let iv: string | undefined = createDto.iv;
    let authTag: string | undefined = createDto.authTag;
    let mimeType = createDto.mimeType;
    let originalName = createDto.originalName;

    // UPDATE without value → keep existing value
    if (action === SettingRequestAction.UPDATE && setting && createDto.value === undefined) {
      value = setting.value;
      iv = setting.iv;
      authTag = setting.authTag;
      mimeType = setting.mimeType ?? mimeType;
      originalName = setting.originalName ?? originalName;
    }

    // 🔒 Key is immutable — always use existing key for UPDATE
    const key =
      action === SettingRequestAction.CREATE
        ? createDto.key!
        : setting!.key;

    const originalValue = action !== SettingRequestAction.CREATE && setting ? setting.value : undefined;
    const originalMimeType = action !== SettingRequestAction.CREATE && setting ? setting.mimeType : undefined;
    const originalOriginalName = action !== SettingRequestAction.CREATE && setting ? setting.originalName : undefined;

    // Create request
    const settingRequest = this.settingRequestRepository.create({
      settingId: createDto.settingId ?? null,
      key,
      value,
      iv,
      authTag,
      mimeType,
      originalName,
      originalValue,
      originalMimeType,
      originalOriginalName,
      status: SettingRequestStatus.PENDING,
      action,
      requestedBy: requestedBy ?? null,
    });

    const savedRequest =
      await this.settingRequestRepository.save(settingRequest);

    return this.findOne(savedRequest.id);
  }

  /**
   * Create a setting request with file upload
   */
  /**
   * Convert base64 string to file buffer
   */
  private convertBase64ToBuffer(
    base64String: string,
    fileName: string,
    mimeType?: string
  ): { buffer: Buffer; fileExtension: string } {
    // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
    let base64Data = base64String;
    if (base64String.includes(',')) {
      base64Data = base64String.split(',')[1];
    }

    // Decode base64 to buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new BadRequestException('Invalid base64 file data');
    }

    // Validate file size (10MB max)
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`
      );
    }

    // Get file extension from filename
    const fileExtension = path.extname(fileName).toLowerCase();

    return { buffer, fileExtension };
  }

  async createWithFile(
    createDto: CreateSettingRequestDto,
    requestedBy?: string,
  ): Promise<SettingRequestResponseDto> {
    if (!createDto.value) {
      throw new BadRequestException('File value (base64) is required');
    }

    if (!createDto.originalName) {
      throw new BadRequestException('originalName is required when uploading a file');
    }

    if (!createDto.mimeType) {
      throw new BadRequestException('mimeType is required when uploading a file');
    }

    // Convert base64 to buffer
    const { buffer, fileExtension } = this.convertBase64ToBuffer(
      createDto.value,
      createDto.originalName,
      createDto.mimeType
    );

    // Validate file extension
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    // Validate MIME type
    const detectedMimeType = await this.detectMimeType(buffer, fileExtension);
    const expectedMimeTypes = FILE_MIME_TYPE_MAP[fileExtension] || [];
    if (
      expectedMimeTypes.length > 0 &&
      !expectedMimeTypes.includes(detectedMimeType)
    ) {
      throw new BadRequestException(
        `File MIME type '${detectedMimeType}' does not match extension '${fileExtension}'. Possible file type mismatch or malicious file.`,
      );
    }

    // Use provided mimeType or detected one
    const mimeType = createDto.mimeType || detectedMimeType;
    const originalName = createDto.originalName;

    // Generate unique filename for request: requests/{requestId}-{uuid}.{extension}
    const requestId = uuidv4();
    const sanitizedFilename = `request-${requestId}${fileExtension}`;
    const relativePath = path.join(SETTINGS_UPLOAD_DIR, sanitizedFilename);
    // Resolve path relative to project root
    const filePath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(process.cwd(), relativePath);

    // Encrypt file buffer
    const { encrypted, iv, authTag } = encryptBuffer(buffer);

    // Save encrypted file to disk
    await fs.writeFile(filePath, encrypted);

    this.logger.log(
      `📤 File uploaded for setting request: ${sanitizedFilename} (${(buffer.length / 1024).toFixed(2)}KB)`,
    );

    // Create request with file path (store relative path in database)
    // IMPORTANT: Include iv and authTag so the file can be decrypted later
    const createDtoWithFile: CreateSettingRequestDto = {
      ...createDto,
      value: relativePath, // Store relative path, not absolute
      mimeType,
      originalName,
      iv, // Store encryption IV for decryption
      authTag, // Store encryption authTag for decryption
    };

    return this.create(createDtoWithFile, requestedBy);
  }

  /**
   * Get all setting requests with pagination and search
   */
  async findAll(
    query: QuerySettingRequestsDto,
  ): Promise<{
    data: SettingRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.settingRequestRepository
      .createQueryBuilder('request')
      .skip(skip)
      .take(limit)
      .orderBy('request.createdAt', 'DESC');

    // Apply search filter
    if (search) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere('request.key LIKE :search', { search: searchTerm });
    }

    const [requests, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    const data = await this.buildResponseDtos(requests);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get a single setting request by ID
   */
  async findOne(id: string): Promise<SettingRequestResponseDto> {
    const request = await this.settingRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Setting request with ID '${id}' not found`);
    }

    return (await this.buildResponseDtos([request]))[0];
  }

  /**
   * Review (approve/reject) a setting request
   */
  async review(
    id: string,
    reviewDto: ReviewSettingRequestDto,
    reviewedBy: string,
  ): Promise<SettingRequestResponseDto> {
    const request = await this.settingRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Setting request with ID '${id}' not found`);
    }

    if (request.status !== SettingRequestStatus.PENDING) {
      throw new BadRequestException(
        `Setting request is already ${request.status}. Only pending requests can be reviewed.`,
      );
    }

    // Update request status
    request.status = reviewDto.status;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewDto.reviewNotes || null;

    await this.settingRequestRepository.save(request);

    // If approved, apply the changes to the actual setting
    if (reviewDto.status === SettingRequestStatus.APPROVED) {
      await this.applyApprovedRequest(request);
    }

    return this.findOne(id);
  }

  /**
   * Apply approved request to the actual setting
   * Creates a new setting, updates existing setting, or deletes setting based on action
   */
  private async applyApprovedRequest(request: SettingRequest): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // Handle DELETE action
      if (request.action === SettingRequestAction.DELETE) {
        if (!request.settingId) {
          throw new BadRequestException('Cannot delete setting: settingId is missing');
        }

        const settingToDelete = await manager.findOne(Setting, {
          where: { id: request.settingId },
        });

        if (!settingToDelete) {
          throw new NotFoundException(`Setting with ID '${request.settingId}' not found`);
        }

        // Hard delete the setting
        await manager.remove(settingToDelete);
        return; // Exit early for delete action
      }

      // Handle CREATE action
      if (request.action === SettingRequestAction.CREATE) {
        // Ensure no setting already exists with the same key
        const existingSetting = await manager.findOne(Setting, {
          where: { key: request.key },
        });

        if (existingSetting) {
          throw new BadRequestException(
            `Setting with key "${request.key}" already exists. Request will remain in PENDING status.`,
          );
        }

        // Handle file path if it's a file setting
        let finalValue = request.value;
        if (request.value && request.value.startsWith('uploads/settings/request-')) {
          // Move file from request path to final path
          const fileExtension = path.extname(request.value);
          const finalFilename = `${request.key}-${uuidv4()}${fileExtension}`;
          const finalPath = path.join(SETTINGS_UPLOAD_DIR, finalFilename);
          
          // Resolve paths relative to project root
          const sourcePath = path.isAbsolute(request.value) 
            ? request.value 
            : path.join(process.cwd(), request.value);
          const targetPath = path.isAbsolute(finalPath)
            ? finalPath
            : path.join(process.cwd(), finalPath);
          
          try {
            await fs.rename(sourcePath, targetPath);
            finalValue = finalPath;
            this.logger.log(`📁 Moved file from request to final location: ${finalPath}`);
          } catch (error) {
            this.logger.error(`Failed to move file from ${request.value} to ${finalPath}`, error);
            throw new BadRequestException('Failed to process file for approved request');
          }
        }

        // Create new setting from request data
        const newSetting = manager.create(Setting, {
          key: request.key,
          value: finalValue,
          iv: request.iv,
          authTag: request.authTag,
          mimeType: request.mimeType,
          originalName: request.originalName,
        });

        await manager.save(newSetting);
        return;
      }

      // Handle UPDATE action
      if (request.action === SettingRequestAction.UPDATE) {
        if (!request.settingId) {
          throw new BadRequestException('Cannot update setting: settingId is missing');
        }

        const existingSetting = await manager.findOne(Setting, {
          where: { id: request.settingId },
        });

        if (!existingSetting) {
          throw new NotFoundException(`Setting with ID '${request.settingId}' not found`);
        }

        // If key is being changed, check for conflicts
        if (request.key !== existingSetting.key) {
          const settingWithNewKey = await manager.findOne(Setting, {
            where: { key: request.key },
          });

          if (settingWithNewKey) {
            throw new BadRequestException(
              `Setting with key "${request.key}" already exists. Request will remain in PENDING status.`,
            );
          }
        }

        // Handle file path if it's a file setting
        let finalValue = request.value;
        if (request.value && request.value.startsWith('uploads/settings/request-')) {
          // Delete old file if it exists
          if (existingSetting.value && existingSetting.value.startsWith('uploads/')) {
            try {
              const oldFilePath = path.isAbsolute(existingSetting.value)
                ? existingSetting.value
                : path.join(process.cwd(), existingSetting.value);
              await fs.unlink(oldFilePath);
              this.logger.log(`🗑️  Deleted old file: ${existingSetting.value}`);
            } catch (error) {
              this.logger.warn(`Failed to delete old file: ${existingSetting.value}`, error);
            }
          }

          // Move file from request path to final path
          const fileExtension = path.extname(request.value);
          const finalFilename = `${request.key}-${uuidv4()}${fileExtension}`;
          const finalPath = path.join(SETTINGS_UPLOAD_DIR, finalFilename);
          
          // Resolve paths relative to project root
          const sourcePath = path.isAbsolute(request.value) 
            ? request.value 
            : path.join(process.cwd(), request.value);
          const targetPath = path.isAbsolute(finalPath)
            ? finalPath
            : path.join(process.cwd(), finalPath);
          
          try {
            await fs.rename(sourcePath, targetPath);
            finalValue = finalPath;
            this.logger.log(`📁 Moved file from request to final location: ${finalPath}`);
          } catch (error) {
            this.logger.error(`Failed to move file from ${request.value} to ${finalPath}`, error);
            throw new BadRequestException('Failed to process file for approved request');
          }
        }

        // Apply proposed changes
        existingSetting.key = request.key;
        existingSetting.value = finalValue;
        existingSetting.iv = request.iv;
        existingSetting.authTag = request.authTag;
        existingSetting.mimeType = request.mimeType;
        existingSetting.originalName = request.originalName;

        await manager.save(existingSetting);
        return;
      }
    });
  }

  /**
   * Delete a setting request
   */
  async remove(id: string): Promise<{ message: string }> {
    const request = await this.settingRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Setting request with ID '${id}' not found`);
    }

    // Only allow deleting PENDING requests
    if (request.status !== SettingRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot delete ${request.status} request. Only pending requests can be deleted.`,
      );
    }

    await this.settingRequestRepository.remove(request);

    return { message: `Setting request with ID '${id}' has been deleted successfully` };
  }

  /**
   * Build response DTOs with original setting snapshot
   */
  private async buildResponseDtos(
    requests: SettingRequest[],
  ): Promise<SettingRequestResponseDto[]> {
    // Collect setting IDs only where fallback MAY be needed
    const settingIds = Array.from(
      new Set(
        requests
          .filter(
            (req) =>
              req.settingId &&
              (req.originalValue === null || req.originalValue === undefined),
          )
          .map((req) => req.settingId!),
      ),
    );
  
    const settingMap = new Map<string, Setting>();
  
    if (settingIds.length > 0) {
      const settings = await this.settingRepository.find({
        where: { id: In(settingIds) },
      });
  
      settings.forEach((setting) => {
        settingMap.set(setting.id, setting);
      });
    }
  
    return requests.map((request) => {
      let originalValue = request.originalValue;
      let originalMimeType = request.originalMimeType;
      let originalOriginalName = request.originalOriginalName;
  
      // Fallback ONLY if snapshot is missing (legacy data)
      if (
        request.settingId &&
        (originalValue === null || originalValue === undefined)
      ) {
        const originalSetting = settingMap.get(request.settingId);
  
        if (originalSetting) {
          originalValue = originalSetting.value;
          originalMimeType = originalSetting.mimeType;
          originalOriginalName = originalSetting.originalName;
        }
      }
  
      return plainToInstance(
        SettingRequestResponseDto,
        {
          ...request,
          originalValue,
          originalMimeType,
          originalOriginalName,
        },
        { excludeExtraneousValues: true },
      );
    });
  }  
}
