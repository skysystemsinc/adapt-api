import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { WarehouseApplicantVerificationService } from './warehouse-applicant-verification.service';
import { CreateWarehouseApplicantVerificationDto } from './dto/create-warehouse-applicant-verification.dto';
import { UpdateWarehouseApplicantVerificationDto } from './dto/update-warehouse-applicant-verification.dto';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('warehouse-applicant-verification')
@UseGuards(JwtAuthGuard)
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

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveVerificationDto,
    @Request() request: any,
  ) {
    const userId = request.user?.sub || request.user?.id;
    return this.warehouseApplicantVerificationService.approve(+id, approveDto, userId);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectVerificationDto,
    @Request() request: any,
  ) {
    const userId = request.user?.sub || request.user?.id;
    return this.warehouseApplicantVerificationService.reject(+id, rejectDto, userId);
  }
}
