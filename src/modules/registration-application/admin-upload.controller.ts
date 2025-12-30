import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Response,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { RegistrationApplicationService } from './registration-application.service';
import { UploadAdminDocumentResponseDto, AdminDocumentResponseDto, UploadAdminDocumentDto } from './dto/upload-admin-document.dto';

@ApiTags('Admin Upload')
@Controller('admin/registration')
export class AdminUploadController {
  constructor(private readonly registrationApplicationService: RegistrationApplicationService) {}

  @Get(':registrationId/detail/:detailId/documents')
  @ApiOperation({ summary: 'Get admin documents for a registration application detail' })
  @ApiParam({ name: 'registrationId', description: 'Registration application ID' })
  @ApiParam({ name: 'detailId', description: 'Registration application detail ID' })
  @ApiResponse({
    status: 200,
    description: 'List of admin documents',
    type: [AdminDocumentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Registration application or detail not found' })
  async getAdminDocuments(
    @Param('registrationId') registrationId: string,
    @Param('detailId') detailId: string,
  ): Promise<AdminDocumentResponseDto[]> {
    return this.registrationApplicationService.getAdminDocumentsByRegistrationAndDetail(
      registrationId,
      detailId,
    );
  }

  @Post(':registrationId/detail/:detailId/upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload admin document for registration application detail' })
  @ApiConsumes('application/json')
  @ApiParam({ name: 'registrationId', description: 'Registration application ID' })
  @ApiParam({ name: 'detailId', description: 'Registration application detail ID' })
  @ApiBody({
    type: UploadAdminDocumentDto,
    description: 'File upload with base64 encoded content',
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: UploadAdminDocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or validation failed' })
  @ApiResponse({ status: 404, description: 'Registration application or detail not found' })
  async uploadAdminDocument(
    @Param('registrationId') registrationId: string,
    @Param('detailId') detailId: string,
    @Body() uploadDto: UploadAdminDocumentDto,
  ): Promise<UploadAdminDocumentResponseDto> {
    if (!uploadDto.file) {
      throw new BadRequestException('No file provided');
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

    return this.registrationApplicationService.uploadAdminDocument(
      registrationId,
      detailId,
      file,
    );
  }

  @Get('documents/:documentId/download')
  @ApiOperation({ summary: 'Download admin document (decrypted)' })
  @ApiParam({ name: 'documentId', description: 'Admin document ID' })
  @ApiResponse({ status: 200, description: 'File content' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadAdminDocument(
    @Param('documentId') documentId: string,
    @Response() res: ExpressResponse,
  ): Promise<void> {
    const { buffer, mimeType, filename } = await this.registrationApplicationService.downloadAdminDocument(documentId);

    // Set security headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');

    res.send(buffer);
  }
}

