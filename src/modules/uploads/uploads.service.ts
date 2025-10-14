import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';

import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/form-field.entity';
import type { UploadFileResponseDto } from './dto/upload-file.dto';

/**
 * MIME type mappings for file extensions
 * Used for validating file types against schema
 */
const MIME_TYPE_MAP: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.txt': ['text/plain'],
  '.csv': ['text/csv', 'application/vnd.ms-excel'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  '.zip': ['application/zip', 'application/x-zip-compressed'],
  '.rar': ['application/x-rar-compressed'],
  '.7z': ['application/x-7z-compressed'],
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Upload a file with dynamic validation from form schema
   */
  async uploadFile(
    formId: string,
    fieldKey: string,
    file: any, // Multer file type
    userId?: string,
  ): Promise<UploadFileResponseDto> {
    this.logger.log(
      `📤 Upload requested: Form=${formId}, Field=${fieldKey}, File=${file.originalname}`,
    );

    // 1. Validate form exists
    const form = await this.formRepository.findOne({ where: { id: formId } });
    if (!form) {
      throw new NotFoundException(`Form with ID '${formId}' not found`);
    }

    // 2. Get field configuration from schema
    const fieldConfig = this.getFieldConfig(form.schema, fieldKey);
    if (!fieldConfig) {
      throw new BadRequestException(
        `Field '${fieldKey}' not found in form schema`,
      );
    }

    if (fieldConfig.type !== 'file') {
      throw new BadRequestException(
        `Field '${fieldKey}' is not a file field (type: ${fieldConfig.type})`,
      );
    }

    // 3. Get validation rules from field metadata
    const validation = fieldConfig.validation || {};
    const allowedTypes = validation.allowedTypes || [];
    const maxSizeMB = validation.maxSize || 10; // Default 10MB

    // 4. Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // 5. Validate MIME type (actual file content, not just extension)
    const detectedMimeType = await this.detectMimeType(file.buffer);
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Check if extension is allowed
    if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Check if detected MIME type matches allowed extension
    const expectedMimeTypes = MIME_TYPE_MAP[fileExtension] || [];
    if (
      expectedMimeTypes.length > 0 &&
      !expectedMimeTypes.includes(detectedMimeType)
    ) {
      throw new BadRequestException(
        `File MIME type '${detectedMimeType}' does not match extension '${fileExtension}'. Possible file type mismatch or malicious file.`,
      );
    }

    // 6. Sanitize filename: UUID + original extension
    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const fileUrl = `/uploads/${sanitizedFilename}`;

    // 7. Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // 8. Log upload
    this.logger.log(
      `✅ File uploaded successfully: ${sanitizedFilename} (${(file.size / 1024).toFixed(2)}KB) by user=${userId || 'anonymous'}`,
    );

    // 9. Return file metadata
    return {
      url: fileUrl,
      path: filePath,
      originalName: file.originalname,
      size: file.size,
      mimeType: detectedMimeType,
    };
  }

  /**
   * Detect actual MIME type from file buffer
   * Uses file-type library for magic number detection
   */
  private async detectMimeType(buffer: Buffer): Promise<string> {
    try {
      const type = await fileTypeFromBuffer(buffer);
      return type?.mime || 'application/octet-stream';
    } catch (error) {
      this.logger.warn('Could not detect MIME type, using default');
      return 'application/octet-stream';
    }
  }

  /**
   * Get field configuration from form schema
   */
  private getFieldConfig(
    schema: Record<string, any>,
    fieldKey: string,
  ): any | null {
    if (!schema.steps || !Array.isArray(schema.steps)) {
      return null;
    }

    for (const step of schema.steps) {
      if (!step.fields || !Array.isArray(step.fields)) {
        continue;
      }

      const field = step.fields.find((f: any) => f.id === fieldKey);
      if (field) {
        return {
          ...field,
          validation: field.validation || {},
        };
      }
    }

    return null;
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`📁 Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Get file from disk for serving
   */
  async getFile(filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      // Check if file exists
      await fs.access(filePath);

      // Read file
      const buffer = await fs.readFile(filePath);

      // Detect MIME type
      const mimeType = await this.detectMimeType(buffer);

      return { buffer, mimeType };
    } catch (error) {
      throw new NotFoundException(`File '${filename}' not found`);
    }
  }

  /**
   * Delete a file from disk
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.unlink(filePath);
      this.logger.log(`🗑️  Deleted file: ${filename}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${filename}`, error);
    }
  }
}

