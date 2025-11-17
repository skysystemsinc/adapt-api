import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WarehouseApplicantVerificationService } from './warehouse-applicant-verification.service';
import { CreateWarehouseApplicantVerificationDto } from './dto/create-warehouse-applicant-verification.dto';
import { UpdateWarehouseApplicantVerificationDto } from './dto/update-warehouse-applicant-verification.dto';

@Controller('warehouse-applicant-verification')
export class WarehouseApplicantVerificationController {
  constructor(private readonly warehouseApplicantVerificationService: WarehouseApplicantVerificationService) {}

  @Post()
  create(@Body() createWarehouseApplicantVerificationDto: CreateWarehouseApplicantVerificationDto) {
    return this.warehouseApplicantVerificationService.create(createWarehouseApplicantVerificationDto);
  }

  @Get()
  findAll() {
    return this.warehouseApplicantVerificationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehouseApplicantVerificationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseApplicantVerificationDto: UpdateWarehouseApplicantVerificationDto) {
    return this.warehouseApplicantVerificationService.update(+id, updateWarehouseApplicantVerificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseApplicantVerificationService.remove(+id);
  }
}
