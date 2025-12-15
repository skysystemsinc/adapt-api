import { Controller, Get, Post, Param, Delete, Query, UseGuards, Req, UploadedFile, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { WarehouseOperatorLocationService } from './warehouse-operator-location.service';
import { QueryOperatorLocationDto } from './dto/query-operator-location.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response as ExpressResponse } from 'express';

@ApiTags('Warehouse Operator Location')
@Controller('warehouse-operator-location')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WarehouseOperatorLocationController {
  constructor(private readonly warehouseOperatorLocationService: WarehouseOperatorLocationService) {}

  @Get('/locations')
  @ApiOperation({ summary: 'Get all warehouse operator locations with pagination' })
  findAllOperatorLocations(
    @Query() query: QueryOperatorLocationDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.warehouseOperatorLocationService.findAllOperatorLocations(userId, query);
  }

  @Get('/locations/:id')
  @ApiOperation({ summary: 'Get warehouse operator location by ID' })
  findOneOperatorLocation(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.warehouseOperatorLocationService.findOneOperatorLocation(id);
  }

  @Post('/locations/:id/certificate')
  @ApiOperation({ summary: 'Upload operator location certificate' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async uploadOperatorLocationCertificate(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const userId = req.user.id;
    return this.warehouseOperatorLocationService.uploadOperatorLocationCertificate(id, userId, file);
  }

  @Get('/locations/:id/certificate/download')
  @ApiOperation({ summary: 'Download operator location certificate' })
  async downloadOperatorLocationCertificate(
    @Param('id') id: string,
    @Res() res: ExpressResponse,
  ) {
    const { buffer, mimeType, filename } = await this.warehouseOperatorLocationService.downloadOperatorLocationCertificate(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');

    res.send(buffer);
  }

  @Delete('/locations/:id/certificate')
  @ApiOperation({ summary: 'Delete operator location certificate' })
  async deleteOperatorLocationCertificate(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.warehouseOperatorLocationService.deleteOperatorLocationCertificate(id);
  }
}
