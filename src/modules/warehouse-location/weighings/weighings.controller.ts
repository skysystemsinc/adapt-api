import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { WeighingsService } from './weighings.service';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { createAndValidateFileFromBase64 } from 'src/common/utils/file-utils';

@Controller('warehouse-location')
export class WeighingsController {
  constructor(private readonly weighingsService: WeighingsService) {}

  // Warehouse Location Weighing endpoints
  @Get(':id/weighing')
  @UseGuards(JwtAuthGuard)
  async getWeighing(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.weighingsService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/weighing')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or update weighing information' })
  @ApiConsumes('application/json')
  @ApiBody({
    type: CreateWeighingDto,
    description: 'Weighing data with required calibration certificate file (base64 encoded)'
  })
  async createWeighing(
    @Param('id') id: string,
    @Body() createWeighingDto: CreateWeighingDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    
    // Extract and convert base64 certificate to file-like object if provided
    let weighbridgeCalibrationCertificateFile: any = undefined;
    if (createWeighingDto.weighbridgeCalibrationCertificate && typeof createWeighingDto.weighbridgeCalibrationCertificate === 'object' && 'file' in createWeighingDto.weighbridgeCalibrationCertificate) {
      weighbridgeCalibrationCertificateFile = createAndValidateFileFromBase64(
        {
          file: createWeighingDto.weighbridgeCalibrationCertificate.file,
          fileName: createWeighingDto.weighbridgeCalibrationCertificate.fileName,
          fileSize: createWeighingDto.weighbridgeCalibrationCertificate.fileSize,
          mimeType: createWeighingDto.weighbridgeCalibrationCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from DTO - service expects undefined for new files
      (createWeighingDto as any).weighbridgeCalibrationCertificate = undefined;
    }
    
    return this.weighingsService.create(id, createWeighingDto, userId, weighbridgeCalibrationCertificateFile);
  }

  @Patch(':id/weighing')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update weighing information' })
  @ApiConsumes('application/json')
  @ApiBody({
    type: CreateWeighingDto,
    description: 'Weighing data with optional calibration certificate file (base64 encoded)'
  })
  async updateWeighing(
    @Param('id') id: string,
    @Body() updateWeighingDto: CreateWeighingDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    
    // Extract and convert base64 certificate to file-like object if provided
    let weighbridgeCalibrationCertificateFile: any = undefined;
    if (updateWeighingDto.weighbridgeCalibrationCertificate && typeof updateWeighingDto.weighbridgeCalibrationCertificate === 'object' && 'file' in updateWeighingDto.weighbridgeCalibrationCertificate) {
      weighbridgeCalibrationCertificateFile = createAndValidateFileFromBase64(
        {
          file: updateWeighingDto.weighbridgeCalibrationCertificate.file,
          fileName: updateWeighingDto.weighbridgeCalibrationCertificate.fileName,
          fileSize: updateWeighingDto.weighbridgeCalibrationCertificate.fileSize,
          mimeType: updateWeighingDto.weighbridgeCalibrationCertificate.mimeType,
        },
        10 * 1024 * 1024, // 10MB max
      );
      // Remove from DTO - service expects undefined for new files
      (updateWeighingDto as any).weighbridgeCalibrationCertificate = undefined;
    }
    
    return this.weighingsService.updateByWarehouseLocationId(id, updateWeighingDto, userId, weighbridgeCalibrationCertificateFile);
  }

  // Legacy endpoints (kept for backward compatibility)
  @Post('weighings')
  create(@Body() createWeighingDto: CreateWeighingDto) {
    // Legacy endpoint - file is required, will throw validation error if not provided
    return this.weighingsService.create('', createWeighingDto, '', null);
  }

  @Get('weighings')
  findAll() {
    return this.weighingsService.findAll();
  }

  @Get('weighings/:id')
  findOne(@Param('id') id: string) {
    return this.weighingsService.findOne(+id);
  }

  @Patch('weighings/:id')
  update(@Param('id') id: string, @Body() updateWeighingDto: UpdateWeighingDto) {
    return this.weighingsService.update(+id, updateWeighingDto);
  }

  @Delete('weighings/:id')
  remove(@Param('id') id: string) {
    return this.weighingsService.remove(+id);
  }
}
