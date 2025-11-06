import {
  Controller,
  Get,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
import { RegistrationApplicationService } from './registration-application.service';
import { UploadAdminDocumentResponseDto, AdminDocumentResponseDto } from './dto/upload-admin-document.dto';

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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Upload admin document for registration application detail' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'registrationId', description: 'Registration application ID' })
  @ApiParam({ name: 'detailId', description: 'Registration application detail ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
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
    @UploadedFile() file: any,
  ): Promise<UploadAdminDocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.registrationApplicationService.uploadAdminDocument(
      registrationId,
      detailId,
      file,
    );
  }
}

