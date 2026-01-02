import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { WarehouseOperatorLocationService } from './warehouse-operator-location.service';
import { QueryOperatorLocationDto } from './dto/query-operator-location.dto';
import { UploadOperatorLocationCertificateDto } from './dto/upload-operator-location-certificate.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiBody, ApiTags } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Upload operator location certificate (base64)' })
  @ApiBody({ type: UploadOperatorLocationCertificateDto })
  async uploadOperatorLocationCertificate(
    @Param('id') id: string,
    @Body() dto: UploadOperatorLocationCertificateDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.warehouseOperatorLocationService.uploadOperatorLocationCertificate(id, userId, dto);
  }

  @Get('/locations/:id/certificate/download')
  @ApiOperation({ summary: 'Download operator location certificate (base64)' })
  async downloadOperatorLocationCertificate(
    @Param('id') id: string,
  ) {
    return this.warehouseOperatorLocationService.downloadOperatorLocationCertificate(id);
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
