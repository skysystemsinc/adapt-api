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
import * as fs from 'fs/promises';
import * as path from 'path';
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
    const filePath = await this.settingsService.getSettingFilePath(key);

    if (!filePath) {
      throw new NotFoundException(`File for setting '${key}' not found`);
    }

    // Verify file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException(`File for setting '${key}' not found on server`);
    }

    // Get filename from path
    const filename = path.basename(filePath);
    const originalFilename = `${key}${path.extname(filePath)}`;

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Send file
    res.download(filePath, originalFilename, (err) => {
      if (err) {
        this.logger.error(`Error downloading file for setting '${key}':`, err);
      } else {
        this.logger.log(`✅ File downloaded for setting '${key}': ${originalFilename}`);
      }
    });
  }
}

