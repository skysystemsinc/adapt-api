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
import { FileUpload } from './entities/file-upload.entity';
import type { UploadFileResponseDto } from './dto/upload-file.dto';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';
import { ClamAVService } from '../clamav/clamav.service';

/**
 * MIME type mappings for file extensions
 * Used for validating file types against form field validation rules
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
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    private readonly clamAVService: ClamAVService,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  /**
   * Upload a file with dynamic validation from form_fields table
   */
  async uploadFile(
    formId: string,
    fieldId: string,
    file: any, // Multer file type
    userId?: string,
  ): Promise<UploadFileResponseDto> {
    this.logger.log(
      `📤 Upload requested: Form=${formId}, Field=${fieldId}, File=${file.originalname}`,
    );

    // 1. Validate form exists
    const form = await this.formRepository.findOne({ where: { id: formId } });
    if (!form) {
      throw new NotFoundException(`Form with ID '${formId}' not found`);
    }

    // 2. Get field configuration from form_fields table (schema is deprecated)
    const formField = await this.formFieldRepository.findOne({
      where: {
        id: fieldId,
        formId: formId,
      },
    });

    if (!formField) {
      throw new BadRequestException(
        `Field '${fieldId}' not found in form`,
      );
    }

    if (formField.type !== 'file') {
      throw new BadRequestException(
        `Field '${fieldId}' is not a file field (type: ${formField.type})`,
      );
    }

    // 3. Get validation rules from field validation property
    const validation = formField.validation || {};
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

    // 5.5. Scan file with ClamAV before processing
    try {
      this.logger.log(`🔍 Scanning file with ClamAV: ${file.originalname}`);
      const scanResult = await this.clamAVService.scanBuffer(
        file.buffer,
        file.originalname,
      );

      if (scanResult.isInfected) {
        this.logger.warn(
          `🚨 Infected file detected: ${file.originalname}, Viruses: ${scanResult.viruses.join(', ')}`,
        );
        throw new BadRequestException(
          `File is infected with malware: ${scanResult.viruses.join(', ')}. Upload rejected.`,
        );
      }

      this.logger.log(`✅ File passed ClamAV scan: ${file.originalname}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Always reject infected files, regardless of CLAMAV_SCAN setting
        throw error;
      }
      
      // Handle ClamAV service failures (unavailable, timeout, etc.)
      const isMandatory = this.clamAVService.getScanMandatory();
      
      if (isMandatory) {
        // CLAMAV_SCAN=true: Block upload if scan fails
        this.logger.error(
          `ClamAV scan failed for ${file.originalname}: ${error.message}`,
          error.stack,
        );
        throw new BadRequestException(
          `Virus scanning unavailable: ${error.message}. Upload blocked due to mandatory scanning.`,
        );
      } else {
        // CLAMAV_SCAN=false: Log warning but allow upload (bypass on failure)
        this.logger.warn(
          `ClamAV scan failed for ${file.originalname}: ${error.message}. Bypassing scan and allowing upload.`,
          error.stack,
        );
      }
    }

    // 6. Sanitize filename: UUID + original extension
    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const fileUrl = `/uploads/${sanitizedFilename}`;

    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);

    // 7. Save file to disk
    // await fs.writeFile(filePath, file.buffer);
    await fs.writeFile(filePath, encrypted);

    // 8. Save encryption metadata to database
    const fileUpload = this.fileUploadRepository.create({
      filePath: fileUrl, // e.g., "/uploads/uuid.pdf"
      iv,
      authTag,
      originalName: file.originalname,
      mimeType: detectedMimeType,
      size: file.size,
    });
    await this.fileUploadRepository.save(fileUpload);

    // 9. Log upload
    this.logger.log(
      `✅ File uploaded successfully: ${sanitizedFilename} (${(file.size / 1024).toFixed(2)}KB) by user=${userId || 'anonymous'}`,
    );

    // 10. Return file metadata
    return {
      url: fileUrl,
      path: filePath,
      originalName: file.originalname,
      size: file.size,
      mimeType: detectedMimeType,
      iv,
      authTag,
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
   * Supports subdirectories (e.g., 'assessment-documents/filename.jpeg')
   * Automatically decrypts files if encryption metadata exists in database
   */
  async getFile(filePath: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    // Normalize the path to prevent directory traversal
    // Remove any leading slashes and normalize
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Join with uploadDir - path.join will handle the subdirectory structure
    const fullPath = path.join(this.uploadDir, normalizedPath);
    
    // Security check: ensure the resolved path is still within uploadDir
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadDir = path.resolve(this.uploadDir);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new BadRequestException('Invalid file path - directory traversal detected');
    }

    try {
      // Check if file exists
      await fs.access(resolvedPath);

      // Read encrypted file from disk
      const encryptedBuffer = await fs.readFile(resolvedPath);

      // Check if this file has encryption metadata in database
      // The filePath parameter is just the filename (e.g., "uuid.pdf")
      // But we store it in DB as "/uploads/uuid.pdf", so construct the full path
      const lookupPath = filePath.startsWith('/uploads/') 
        ? filePath 
        : `/uploads/${filePath}`;
      
      this.logger.log(`🔍 Looking up file metadata for path: ${lookupPath}`);
      const fileUpload = await this.fileUploadRepository.findOne({
        where: { filePath: lookupPath },
      });
      
      if (fileUpload) {
        this.logger.log(`✅ Found file metadata for ${lookupPath}`);
      } else {
        this.logger.warn(`⚠️ No file metadata found for ${lookupPath} - assuming unencrypted`);
      }

      let buffer: Buffer;
      let mimeType: string;
      let filename: string;

      if (fileUpload && fileUpload.iv && fileUpload.authTag) {
        // File has encryption metadata - decrypt it
        try {
          buffer = decryptBuffer(encryptedBuffer, fileUpload.iv, fileUpload.authTag);
          mimeType = fileUpload.mimeType || (await this.detectMimeType(buffer));
          filename = fileUpload.originalName || path.basename(normalizedPath);
        } catch (error) {
          this.logger.error(`Failed to decrypt file ${filePath}: ${error.message}`);
          throw new BadRequestException(`Failed to decrypt file: ${error.message}`);
        }
      } else {
        // No encryption metadata - assume file is not encrypted (backward compatibility)
        buffer = encryptedBuffer;
        mimeType = await this.detectMimeType(buffer);
        filename = path.basename(normalizedPath);
      }

      return { buffer, mimeType, filename };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException(`File '${filePath}' not found`);
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

