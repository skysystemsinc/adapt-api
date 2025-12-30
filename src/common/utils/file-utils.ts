import { BadRequestException } from '@nestjs/common';

/**
 * Decode base64 string to Buffer
 * @param base64String - Base64 encoded string
 * @returns Buffer containing decoded file data
 * @throws BadRequestException if base64 string is invalid
 */
export function decodeBase64ToBuffer(base64String: string): Buffer {
  try {
    return Buffer.from(base64String, 'base64');
  } catch (error) {
    throw new BadRequestException('Invalid base64 file data');
  }
}

/**
 * Create a file-like object from base64 data that matches Multer file structure
 * This ensures existing service code continues to work without changes
 * @param base64String - Base64 encoded file data
 * @param fileName - Original filename
 * @param fileSize - File size in bytes (optional, will be calculated from buffer if not provided)
 * @param mimeType - MIME type (optional, defaults to application/octet-stream)
 * @returns File-like object with buffer, originalname, size, and mimetype properties
 */
export function createFileFromBase64(
  base64String: string,
  fileName: string,
  fileSize?: number,
  mimeType?: string,
): {
  buffer: Buffer;
  originalname: string;
  size: number;
  mimetype: string;
} {
  const buffer = decodeBase64ToBuffer(base64String);
  const size = fileSize || buffer.length;

  return {
    buffer,
    originalname: fileName,
    size,
    mimetype: mimeType || 'application/octet-stream',
  };
}

/**
 * Validate file size
 * @param fileSize - File size in bytes
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 100MB)
 * @throws BadRequestException if file size exceeds maximum
 */
export function validateFileSize(
  fileSize: number,
  maxSizeBytes: number = 100 * 1024 * 1024,
): void {
  if (fileSize > maxSizeBytes) {
    throw new BadRequestException(
      `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
    );
  }
}

/**
 * Create file from base64 DTO and validate
 * @param dto - DTO containing base64 file data, fileName, fileSize, and optional mimeType
 * @param maxSizeBytes - Maximum allowed file size in bytes (default: 100MB)
 * @returns File-like object
 */
export function createAndValidateFileFromBase64(
  dto: {
    file: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
  },
  maxSizeBytes: number = 100 * 1024 * 1024,
): {
  buffer: Buffer;
  originalname: string;
  size: number;
  mimetype: string;
} {
  if (!dto.file) {
    throw new BadRequestException('No file provided');
  }

  if (!dto.fileName) {
    throw new BadRequestException('fileName is required');
  }

  const file = createFileFromBase64(
    dto.file,
    dto.fileName,
    dto.fileSize,
    dto.mimeType,
  );

  validateFileSize(file.size, maxSizeBytes);

  return file;
}

