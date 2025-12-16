import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { SettingRequest, SettingRequestStatus, SettingRequestAction } from '../entities/setting-request.entity';
import { Setting } from '../entities/setting.entity';
import { CreateSettingRequestDto } from '../dto/create-setting-request.dto';
import { ReviewSettingRequestDto } from '../dto/review-setting-request.dto';
import { SettingRequestResponseDto } from '../dto/setting-request-response.dto';
import { SettingsService } from '../settings.service';

@Injectable()
export class SettingRequestsService {
  constructor(
    @InjectRepository(SettingRequest)
    private readonly settingRequestRepository: Repository<SettingRequest>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    private readonly settingsService: SettingsService,
    private readonly dataSource: DataSource,
  ) { }

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
    let iv: string | undefined;
    let authTag: string | undefined;
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
   * Get all setting requests
   */
  async findAll(): Promise<SettingRequestResponseDto[]> {
    const requests = await this.settingRequestRepository.find({
      order: { createdAt: 'DESC' },
    });

    return this.buildResponseDtos(requests);
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

        // Create new setting from request data
        const newSetting = manager.create(Setting, {
          key: request.key,
          value: request.value,
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

        // Apply proposed changes
        existingSetting.key = request.key;
        existingSetting.value = request.value;
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
