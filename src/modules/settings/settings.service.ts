import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';

/**
 * MIME type mappings for file extensions
 */
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

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SETTINGS_UPLOAD_DIR = 'uploads/settings';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  async create(createDto: CreateSettingDto): Promise<Setting> {
    // Check if setting with this key already exists
    const existing = await this.settingsRepository.findOne({
      where: { key: createDto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting with key "${createDto.key}" already exists`);
    }

    const setting = this.settingsRepository.create(createDto);
    return this.settingsRepository.save(setting);
  }

  async findAll(): Promise<Setting[]> {
    return this.settingsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID "${id}" not found`);
    }

    return setting;
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async update(id: string, updateDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findOne(id);

    // If updating key, check if new key already exists
    if (updateDto.key && updateDto.key !== setting.key) {
      const existing = await this.settingsRepository.findOne({
        where: { key: updateDto.key },
      });

      if (existing) {
        throw new ConflictException(`Setting with key "${updateDto.key}" already exists`);
      }
    }

    Object.assign(setting, updateDto);
    return this.settingsRepository.save(setting);
  }

  async updateByKey(key: string, value: string): Promise<Setting> {
    const setting = await this.findByKey(key);
    setting.value = value;
    return this.settingsRepository.save(setting);
  }

  async remove(id: string): Promise<void> {
    const setting = await this.findOne(id);
    await this.settingsRepository.remove(setting);
  }

  async removeByKey(key: string): Promise<void> {
    const setting = await this.findByKey(key);
    await this.settingsRepository.remove(setting);
  }

  /**
   * Upload file for a setting
   * Validates file type and size, saves to uploads/settings/, and stores path in settings
   */
  async uploadSettingFile(key: string, file: any): Promise<Setting> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
      );
    }

    // Validate file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    // Validate MIME type
    const detectedMimeType = await this.detectMimeType(file.buffer, fileExtension);
    const expectedMimeTypes = FILE_MIME_TYPE_MAP[fileExtension] || [];
    if (
      expectedMimeTypes.length > 0 &&
      !expectedMimeTypes.includes(detectedMimeType)
    ) {
      throw new BadRequestException(
        `File MIME type '${detectedMimeType}' does not match extension '${fileExtension}'. Possible file type mismatch or malicious file.`,
      );
    }

    // Store original filename and MIME type for proper download
    const originalName = file.originalname;
    const mimeType = detectedMimeType || file.mimetype;
    
    this.logger.log(`📤 Storing file metadata for setting '${key}': originalName=${originalName}, mimeType=${mimeType}, extension=${fileExtension}`);

    // Check for existing setting and delete old file if exists
    try {
      const existingSetting = await this.settingsRepository.findOne({
        where: { key },
      });

      if (existingSetting && existingSetting.value) {
        // Check if old value is a file path (starts with uploads/)
        if (existingSetting.value.startsWith('uploads/')) {
          try {
            await fs.unlink(existingSetting.value);
            this.logger.log(`🗑️  Deleted old file: ${existingSetting.value}`);
          } catch (error) {
            this.logger.warn(`Failed to delete old file: ${existingSetting.value}`, error);
            // Continue even if old file deletion fails
          }
        }
      }
    } catch (error) {
      // If setting doesn't exist, that's fine - we'll create it
      this.logger.log(`No existing setting found for key: ${key}`);
    }

    // Generate unique filename: {key}-{uuid}.{extension}
    const sanitizedFilename = `${key}-${uuidv4()}${fileExtension}`;
    const filePath = path.join(SETTINGS_UPLOAD_DIR, sanitizedFilename);

    // Ensure directory exists
    await this.ensureUploadDirectory();

    // Encrypt file buffer
    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);

    // Save encrypted file to disk
    await fs.writeFile(filePath, encrypted);

    this.logger.log(
      `✅ File uploaded and encrypted for setting '${key}': ${sanitizedFilename} (${(file.size / 1024).toFixed(2)}KB)`,
    );

    // Update or create setting
    let setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (setting) {
      setting.value = filePath;
      setting.iv = iv;
      setting.authTag = authTag;
      setting.originalName = originalName;
      setting.mimeType = mimeType;
      const saved = await this.settingsRepository.save(setting);
      this.logger.log(`💾 Updated setting '${key}' with originalName=${saved.originalName}, mimeType=${saved.mimeType}`);
      return saved;
    } else {
      // Create new setting
      setting = this.settingsRepository.create({
        key,
        value: filePath,
        iv,
        authTag,
        originalName,
        mimeType,
      });
      const saved = await this.settingsRepository.save(setting);
      this.logger.log(`💾 Created setting '${key}' with originalName=${saved.originalName}, mimeType=${saved.mimeType}`);
      return saved;
    }
  }

  /**
   * Get file path for a setting
   */
  async getSettingFilePath(key: string): Promise<string | null> {
    try {
      const setting = await this.settingsRepository.findOne({
        where: { key },
      });

      if (!setting || !setting.value) {
        return null;
      }

      // Check if value is a file path (handle both forward and backslashes)
      const normalizedValue = setting.value.replace(/\\/g, '/');
      if (!normalizedValue.startsWith('uploads/')) {
        return null; // Not a file, it's a regular value
      }

      // Normalize path for file system access (use path.join for cross-platform compatibility)
      const filePath = path.normalize(setting.value);

      // Verify file exists
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        this.logger.warn(`File not found at path: ${filePath}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error retrieving file path for key '${key}'`, error);
      return null;
    }
  }

  /**
   * Get decrypted file buffer for a setting
   * Automatically decrypts files if encryption metadata exists in database
   */
  async getSettingFileBuffer(key: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const setting = await this.findByKey(key);

    if (!setting || !setting.value) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    // Check if value is a file path (handle both forward and backslashes)
    const normalizedValue = setting.value.replace(/\\/g, '/');
    if (!normalizedValue.startsWith('uploads/')) {
      throw new BadRequestException(`Setting '${key}' is not a file setting`);
    }

    // Normalize path for file system access
    const filePath = path.normalize(setting.value);

    // Verify file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException(`File for setting '${key}' not found on server`);
    }

    // Read encrypted file from disk
    const encryptedBuffer = await fs.readFile(filePath);
    this.logger.log(`📖 Read encrypted file for setting '${key}': ${encryptedBuffer.length} bytes`);

    let buffer: Buffer;
    let mimeType: string;
    let filename: string;

    // Extract filename from the path stored in value column (for fallback)
    // value contains path like "uploads/settings/self-assessment-uuid.pdf"
    const filenameFromPath = setting.value.split('/').pop() || setting.value;
    const fileExtension = path.extname(filenameFromPath).toLowerCase();
    
    if (setting.iv && setting.authTag) {
      // File has encryption metadata - decrypt it
      try {
        this.logger.log(`🔓 Attempting to decrypt file for setting '${key}' (iv: ${setting.iv.substring(0, 8)}..., authTag: ${setting.authTag.substring(0, 8)}...)`);
        buffer = decryptBuffer(encryptedBuffer, setting.iv, setting.authTag);
        
        // Validate decrypted buffer
        if (!buffer || buffer.length === 0) {
          throw new Error('Decryption resulted in empty buffer');
        }
      } catch (error) {
        this.logger.error(`❌ Failed to decrypt file for setting '${key}': ${error.message}`, error.stack);
        throw new BadRequestException(`Failed to decrypt file: ${error.message}`);
      }
    } else {
      // No encryption metadata - assume file is not encrypted (backward compatibility)
      buffer = encryptedBuffer;
    }

    // Use stored MIME type from database first, then detect from buffer/extension (same as registration application)
    if (setting.mimeType) {
      mimeType = setting.mimeType;
      this.logger.log(`📄 Using stored MIME type from database: ${mimeType} for setting '${key}'`);
    } else {
      mimeType = await this.detectMimeType(buffer, fileExtension);
      this.logger.warn(`⚠️  No stored MIME type found for setting '${key}', detected: ${mimeType} (extension: ${fileExtension})`);
    }
    
    // Use stored original filename from database first, then extract from path stored in value column
    if (setting.originalName) {
      filename = setting.originalName;
      this.logger.log(`📝 Using stored original filename from database: ${filename} for setting '${key}'`);
    } else {
      filename = filenameFromPath;
      this.logger.warn(`⚠️  No stored original filename found for setting '${key}', using filename from path: ${filename}`);
    }
    
    this.logger.log(`✅ File for setting '${key}': ${filename} (${buffer.length} bytes, mime: ${mimeType})`);
    
    // Debug: Log what's in the database
    this.logger.debug(`🔍 Database values for setting '${key}': originalName=${setting.originalName}, mimeType=${setting.mimeType}`);

    // Final validation
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException(`File buffer is empty for setting '${key}'`);
    }

    return { buffer, mimeType, filename };
  }

  /**
   * Check if a setting value is a file path
   */
  isFileSetting(value: string): boolean {
    // Handle both forward and backslashes (Windows vs Unix)
    const normalized = value.replace(/\\/g, '/');
    return normalized.startsWith('uploads/');
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    const ext = extension.toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  /**
   * Detect actual MIME type from file buffer
   * Falls back to extension-based detection if buffer detection fails
   */
  private async detectMimeType(buffer: Buffer, fileExtension?: string): Promise<string> {
    try {
      const type = await fileTypeFromBuffer(buffer);
      if (type?.mime) {
        return type.mime;
      }
    } catch (error) {
      this.logger.warn('Could not detect MIME type from buffer');
    }

    // Fallback to extension-based detection
    if (fileExtension) {
      const mimeFromExt = this.getMimeTypeFromExtension(fileExtension);
      this.logger.log(`Using extension-based MIME type: ${mimeFromExt} for extension: ${fileExtension}`);
      return mimeFromExt;
    }

    return 'application/octet-stream';
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(SETTINGS_UPLOAD_DIR);
    } catch {
      await fs.mkdir(SETTINGS_UPLOAD_DIR, { recursive: true });
      this.logger.log(`📁 Created upload directory: ${SETTINGS_UPLOAD_DIR}`);
    }
  }
}

