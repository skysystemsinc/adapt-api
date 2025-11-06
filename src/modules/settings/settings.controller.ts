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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateSettingValueDto } from './dto/update-setting-value.dto';
import { Setting } from './entities/setting.entity';

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

