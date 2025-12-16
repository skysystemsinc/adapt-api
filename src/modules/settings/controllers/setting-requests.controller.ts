import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingRequestsService } from '../services/setting-requests.service';
import { CreateSettingRequestDto } from '../dto/create-setting-request.dto';
import { ReviewSettingRequestDto } from '../dto/review-setting-request.dto';
import { SettingRequestResponseDto } from '../dto/setting-request-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../rbac/constants/permissions.constants';

@ApiTags('Setting Requests')
@Controller('admin/settings/setting-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permissions.MANAGE_SETTING_REQUESTS)
export class SettingRequestsController {
  constructor(private readonly settingRequestsService: SettingRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a setting request for approval' })
  @ApiBody({ type: CreateSettingRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Setting request created successfully',
    type: SettingRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 400, description: 'Bad request (duplicate key, pending request exists, etc.)' })
  async create(
    @Body() createSettingRequestDto: CreateSettingRequestDto,
    @Request() req: any,
  ): Promise<SettingRequestResponseDto> {
    const requestedBy = req.user?.id;
    return this.settingRequestsService.create(createSettingRequestDto, requestedBy);
  }

  @Post('with-file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a setting request with file upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        settingId: {
          type: 'string',
          format: 'uuid',
        },
        key: {
          type: 'string',
        },
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete'],
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Setting request with file created successfully',
    type: SettingRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createWithFile(
    @UploadedFile() file: any,
    @Body() body: any,
    @Request() req: any,
  ): Promise<SettingRequestResponseDto> {
    const requestedBy = req.user?.id;
    const createDto: CreateSettingRequestDto = {
      settingId: body.settingId,
      key: body.key,
      action: body.action as any,
      mimeType: file?.mimetype,
      originalName: file?.originalname,
    };
    return this.settingRequestsService.createWithFile(createDto, file, requestedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all setting requests' })
  @ApiResponse({
    status: 200,
    description: 'List of all setting requests',
    type: [SettingRequestResponseDto],
  })
  async findAll(): Promise<SettingRequestResponseDto[]> {
    return this.settingRequestsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a setting request by ID' })
  @ApiParam({ name: 'id', description: 'Setting Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Setting request details',
    type: SettingRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Setting request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SettingRequestResponseDto> {
    return this.settingRequestsService.findOne(id);
  }

  @Put(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) a setting request' })
  @ApiParam({ name: 'id', description: 'Setting Request ID (UUID)' })
  @ApiBody({ type: ReviewSettingRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Setting request reviewed successfully',
    type: SettingRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Setting request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewSettingRequestDto,
    @Request() req: any,
  ): Promise<SettingRequestResponseDto> {
    const reviewedBy = req.user?.id;
    return this.settingRequestsService.review(id, reviewDto, reviewedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a setting request' })
  @ApiParam({ name: 'id', description: 'Setting Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Setting request deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Setting request not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete non-pending request' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.settingRequestsService.remove(id);
  }
}
