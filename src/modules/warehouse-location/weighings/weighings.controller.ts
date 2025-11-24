import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { WeighingsService } from './weighings.service';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateWeighingDto,
    description: 'Weighing data with required calibration certificate file'
  })
  @UseInterceptors(
    FileInterceptor('weighbridgeCalibrationCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async createWeighing(
    @Param('id') id: string,
    @Body() createWeighingDto: CreateWeighingDto,
    @UploadedFile() weighbridgeCalibrationCertificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.weighingsService.create(id, createWeighingDto, userId, weighbridgeCalibrationCertificateFile);
  }

  @Patch(':id/weighing')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update weighing information' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateWeighingDto,
    description: 'Weighing data with optional calibration certificate file'
  })
  @UseInterceptors(
    FileInterceptor('weighbridgeCalibrationCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async updateWeighing(
    @Param('id') id: string,
    @Body() updateWeighingDto: CreateWeighingDto,
    @UploadedFile() weighbridgeCalibrationCertificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
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
