import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  Response,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import * as path from 'path';

import { UploadsService } from './uploads.service';
import { UploadFileDto, UploadFileResponseDto } from './dto/upload-file.dto';
import { UploadRateLimitGuard } from './guards/upload-rate-limit.guard';
import { ClamAVService } from '../clamav/clamav.service';
import {
  FileScanResponseDto,
  BatchScanResponseDto,
} from '../clamav/dto/scan-result.dto';

@ApiTags('File Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly clamAVService: ClamAVService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UploadRateLimitGuard)
  @ApiOperation({ summary: 'Upload a file for form submission' })
  @ApiConsumes('application/json')
  @ApiBody({
    type: UploadFileDto,
    description: 'File upload with base64 encoded content',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadFileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or validation failed' })
  @ApiResponse({ status: 404, description: 'Form or field not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async uploadFile(
    @Body() uploadDto: UploadFileDto,
  ): Promise<UploadFileResponseDto> {
    console.log('📥 Upload request received:', {
      formId: uploadDto.formId,
      fieldId: uploadDto.fieldId,
      fileName: uploadDto.fileName,
      fileSize: uploadDto.fileSize,
      hasBase64: !!uploadDto.file,
    });

    if (!uploadDto.file) {
      throw new BadRequestException('No file provided');
    }

    if (!uploadDto.formId) {
      throw new BadRequestException('formId is required');
    }

    if (!uploadDto.fieldId) {
      throw new BadRequestException('fieldId is required');
    }

    // Decode base64 to buffer
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(uploadDto.file, 'base64');
    } catch (error) {
      throw new BadRequestException('Invalid base64 file data');
    }

    // Validate file size (100MB max)
    const maxSizeBytes = 100 * 1024 * 1024;
    if (fileBuffer.length > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 100MB`,
      );
    }

    // Create file-like object that matches Multer file structure
    // This ensures existing service code continues to work
    const file = {
      buffer: fileBuffer,
      originalname: uploadDto.fileName,
      size: uploadDto.fileSize || fileBuffer.length,
      mimetype: uploadDto.mimeType || 'application/octet-stream',
    };

    return this.uploadsService.uploadFile(
      uploadDto.formId,
      uploadDto.fieldId,
      file,
      uploadDto.userId,
    );
  }

  @Get('*')
  @ApiOperation({ summary: 'Download/view an uploaded file' })
  @ApiResponse({ status: 200, description: 'File content' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Req() req: any,
    @Response() res: ExpressResponse,
  ): Promise<void> {
    // Extract the path from the request URL
    // The URL will be like /uploads/assessment-documents/filename.jpeg
    // We need to extract everything after /uploads/
    const fullUrl = req.url;
    const uploadsPrefix = '/uploads/';
    
    if (!fullUrl.startsWith(uploadsPrefix)) {
      throw new BadRequestException('Invalid file path');
    }

    // Get the path after /uploads/
    const filePath = fullUrl.slice(uploadsPrefix.length);

    // Validate filePath (prevent directory traversal)
    if (!filePath || filePath.includes('..') || filePath.includes('\\')) {
      throw new BadRequestException('Invalid file path');
    }

    console.log('📂 File path:', filePath);
    const { buffer, mimeType, filename } = await this.uploadsService.getFile(filePath);

    // Extract just the filename for Content-Disposition header
    const displayFilename = path.basename(filePath);

    // Set security headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${displayFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');

    res.send(buffer);
  }

  /**
   * Simple file upload endpoint with ClamAV scanning
   * This endpoint demonstrates the ClamAV integration without form validation
   */
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UploadRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload and scan a file with ClamAV',
    description:
      'Uploads a file and scans it with ClamAV. Returns scan result without saving the file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File scan result',
    type: FileScanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or malware detected' })
  async scanFile(
    @UploadedFile() file: any,
  ): Promise<FileScanResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const scanResult = await this.clamAVService.scanBuffer(
        file.buffer,
        file.originalname,
      );

      if (scanResult.isInfected) {
        return {
          status: 'infected',
          file: file.originalname,
          viruses: scanResult.viruses,
        };
      }

      return {
        status: 'clean',
        file: file.originalname,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to scan file: ${error.message}`,
      );
    }
  }

  /**
   * Batch file upload endpoint with ClamAV scanning
   * Supports scanning multiple files in a single request
   */
  @Post('scan/batch')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UploadRateLimitGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max per file
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload and scan multiple files with ClamAV',
    description:
      'Uploads multiple files and scans each with ClamAV. Returns batch scan results.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Batch file scan results',
    type: BatchScanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid files or request' })
  async scanBatchFiles(
    @UploadedFiles() files: any[],
  ): Promise<BatchScanResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results: FileScanResponseDto[] = [];
    let cleanCount = 0;
    let infectedCount = 0;

    // Scan all files in parallel for better performance
    // Future enhancement: Use a queue-based approach for very large batches
    const scanPromises = files.map(async (file) => {
      try {
        const scanResult = await this.clamAVService.scanBuffer(
          file.buffer,
          file.originalname,
        );

        if (scanResult.isInfected) {
          infectedCount++;
          return {
            status: 'infected' as const,
            file: file.originalname,
            viruses: scanResult.viruses,
          };
        } else {
          cleanCount++;
          return {
            status: 'clean' as const,
            file: file.originalname,
          };
        }
      } catch (error) {
        // Log error but continue processing other files
        console.error(`Error scanning ${file.originalname}:`, error);
        infectedCount++;
        return {
          status: 'infected' as const,
          file: file.originalname,
          viruses: [`Scan error: ${error.message}`],
        };
      }
    });

    results.push(...(await Promise.all(scanPromises)));

    return {
      total: files.length,
      clean: cleanCount,
      infected: infectedCount,
      results,
    };
  }
}

