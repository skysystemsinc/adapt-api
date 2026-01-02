import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, Res } from '@nestjs/common';
import { WarehouseAdminService } from './warehouse-admin.service';
import { CreateWarehouseAdminDto } from './dto/create-warehouse-admin.dto';
import { UpdateWarehouseAdminDto } from './dto/update-warehouse-admin.dto';
import { QueryOperatorApplicationDto } from './dto/query-operator-application.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { UnlockRequestApprovalDto } from './dto/unlock-request-approval.dto';
import { UploadOperatorCertificateDto } from './dto/upload-operator-certificate.dto';

@Controller('warehouse-admin')
export class WarehouseAdminController {
  constructor(private readonly warehouseAdminService: WarehouseAdminService) { }

  @Post()
  create(@Body() createWarehouseAdminDto: CreateWarehouseAdminDto) {
    return this.warehouseAdminService.create(createWarehouseAdminDto);
  }

  @Get('/application/operators')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all warehouse operators' })
  findAllWareHouseOperators(
    @Query() query: QueryOperatorApplicationDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.findAllWareHouseOperatorsPaginated(query, userId);
  }

  @Get('/application/:id/operators')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get warehouse operator application by ID' })
  findOneWareHouseOperator(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.findOne(id, userId);
  }

  @Get('/application/:id/operator-unlock-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unlock request by ID' })
  findOneUnlockRequest(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.findOneUnlockRequest(id, userId);
  }

  @Get('/application/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all warehouse roles' })
  findAllWareHouseRoles(
    @Req() req: any,
    @Query('applicationId') applicationId?: string,
    @Query('type') type?: string,
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.findAllWareHouseRoles(userId, applicationId, type || null);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseAdminDto: UpdateWarehouseAdminDto) {
    return this.warehouseAdminService.update(+id, updateWarehouseAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseAdminService.remove(+id);
  }

  @Get('/operators')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all warehouse operators' })
  findAllOperators(
    @Query() query: QueryOperatorApplicationDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.findAllOperators(userId, query);
  }

  @Get('/operators/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get warehouse operator by ID' })
  findOneOperator(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.warehouseAdminService.findOneOperator(id);
  }

  @Post('/operators/:id/certificate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload operator certificate (base64)' })
  @ApiBody({ type: UploadOperatorCertificateDto })
  async uploadOperatorCertificate(
    @Param('id') id: string,
    @Body() dto: UploadOperatorCertificateDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.uploadOperatorCertificate(id, userId, dto);
  }

  @Get('/operators/:id/certificate/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Download operator certificate (base64)' })
  async downloadOperatorCertificate(
    @Param('id') id: string,
  ) {
    return this.warehouseAdminService.downloadOperatorCertificate(id);
  }

  @Delete('/operators/:id/certificate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete operator certificate' })
  async deleteOperatorCertificate(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.warehouseAdminService.deleteOperatorCertificate(id);
  }

  @Post('/operators/request-approvals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request approval for operator' })
  async listOperatorRequestApprovals(
    @Query() query: QueryOperatorApplicationDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.listOperatorRequestApprovals(query, userId);
  }

  @Get('/operators/request-approvals/:id/bankslip/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Download bank payment slip for unlock request' })
  async downloadUnlockRequestBankslip(
    @Param('id') id: string,
    @Res() res: ExpressResponse,
  ) {
    const { buffer, mimeType, filename } = await this.warehouseAdminService.downloadUnlockRequestBankslip(id);

    // Set security headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');

    res.send(buffer);
  }

  @Patch('/operators/request-approvals/:id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Review unlock request' })
  @ApiBody({ type: UnlockRequestApprovalDto })
  async reviewUnlockRequest(
    @Param('id') id: string,
    @Body() reviewUnlockRequestDto: UnlockRequestApprovalDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.reviewUnlockRequest(id, reviewUnlockRequestDto, userId);
  }
}
