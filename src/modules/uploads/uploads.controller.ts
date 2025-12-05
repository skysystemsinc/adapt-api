import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  Response,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

@ApiTags('File Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UploadRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a file for form submission' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        formId: { type: 'string', format: 'uuid' },
        fieldId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['formId', 'fieldId', 'file'],
    },
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
    @Body('formId') formId: string,
    @Body('fieldId') fieldId: string,
    @Body('userId') userId: string | undefined,
    @UploadedFile() file: any, // Multer file type
  ): Promise<UploadFileResponseDto> {
    console.log('📥 Upload request received:', {
      formId,
      fieldId,
      fileReceived: !!file,
      fileName: file?.originalname,
      fileSize: file?.size,
    });

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!formId) {
      throw new BadRequestException('formId is required');
    }

    if (!fieldId) {
      throw new BadRequestException('fieldId is required');
    }

    return this.uploadsService.uploadFile(formId, fieldId, file, userId);
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
}

