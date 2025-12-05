import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateSettingValueDto } from './dto/update-setting-value.dto';
import { Setting } from './entities/setting.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new setting' })
  @ApiBody({ type: CreateSettingDto })
  @ApiResponse({ status: 201, description: 'Setting created', type: Setting })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSettingDto): Promise<Setting> {
    return this.settingsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'List of settings', type: [Setting] })
  async findAll(): Promise<Setting[]> {
    return this.settingsService.findAll();
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get a setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting found', type: Setting })
  async findByKey(@Param('key') key: string): Promise<Setting> {
    return this.settingsService.findByKey(key);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a setting by ID' })
  @ApiParam({ name: 'id', description: 'Setting ID' })
  @ApiResponse({ status: 200, description: 'Setting found', type: Setting })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Setting> {
    return this.settingsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a setting' })
  @ApiParam({ name: 'id', description: 'Setting ID' })
  @ApiBody({ type: UpdateSettingDto })
  @ApiResponse({ status: 200, description: 'Setting updated', type: Setting })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSettingDto,
  ): Promise<Setting> {
    return this.settingsService.update(id, updateDto);
  }

  @Put('key/:key')
  @ApiOperation({ summary: 'Update a setting value by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiBody({ type: UpdateSettingValueDto })
  @ApiResponse({ status: 200, description: 'Setting updated', type: Setting })
  async updateByKey(
    @Param('key') key: string,
    @Body() updateDto: UpdateSettingValueDto,
  ): Promise<Setting> {
    return this.settingsService.updateByKey(key, updateDto.value);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a setting' })
  @ApiParam({ name: 'id', description: 'Setting ID' })
  @ApiResponse({ status: 204, description: 'Setting deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.settingsService.remove(id);
  }

  @Delete('key/:key')
  @ApiOperation({ summary: 'Delete a setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 204, description: 'Setting deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByKey(@Param('key') key: string): Promise<void> {
    return this.settingsService.removeByKey(key);
  }
}

@ApiTags('Admin - Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsAdminController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post(':key/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @RequirePermissions(Permissions.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Upload file for a setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiConsumes('multipart/form-data')
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
    description: 'File uploaded successfully',
    type: Setting,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or validation failed' })
  async uploadFile(
    @Param('key') key: string,
    @UploadedFile() file: any, // Multer file type
  ): Promise<Setting> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.settingsService.uploadSettingFile(key, file);
  }
}

