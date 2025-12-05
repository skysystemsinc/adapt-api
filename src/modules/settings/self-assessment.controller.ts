import {
  Controller,
  Get,
  UseGuards,
  Res,
  NotFoundException,
  Logger,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsDownloadController {
  private readonly logger = new Logger(SettingsDownloadController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key/download')
  @ApiOperation({ summary: 'Download file for a setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
  })
  @ApiResponse({ status: 404, description: 'Setting file not found' })
  async downloadFile(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Get decrypted file buffer
      const { buffer, mimeType, filename } = await this.settingsService.getSettingFileBuffer(key);

      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mimeType);

      // Send decrypted buffer
      res.send(buffer);
      this.logger.log(`✅ File downloaded and decrypted for setting '${key}': ${filename}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error downloading file for setting '${key}':`, error);
      throw error;
    }
  }
}

