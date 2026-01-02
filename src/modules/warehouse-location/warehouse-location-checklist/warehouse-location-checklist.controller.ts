import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { WarehouseLocationChecklistService } from './warehouse-location-checklist.service';
import { CreateWarehouseLocationChecklistDto } from '../dto/create-warehouse-location-checklist.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@ApiTags('Warehouse Location')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse-location')
@UseGuards(JwtAuthGuard)
export class WarehouseLocationChecklistController {
  constructor(
    private readonly warehouseLocationChecklistService: WarehouseLocationChecklistService,
  ) {}

  @ApiOperation({ summary: 'Get warehouse location checklist for a warehouse location' })
  @ApiBearerAuth('JWT-auth')
  @Get('/:id/key-submission-checklist')
  getWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Request() request: any,
  ) {
    const user = request.user as User;
    return this.warehouseLocationChecklistService.getWarehouseLocationChecklist(warehouseLocationId, user.id);
  }

  @ApiOperation({ summary: 'Create or update warehouse location checklist' })
  @ApiBearerAuth('JWT-auth')
  @Post('/:id/key-submission-checklist')
  createWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Body() payload: CreateWarehouseLocationChecklistDto,
    @Query('submit') submitParam?: string,
    @Request() request?: any,
  ) {
    const user = request?.user as User;
    if (!user) {
      throw new BadRequestException('User not found in request');
    }
    const submit = submitParam === 'true' || submitParam === '1';
    return this.warehouseLocationChecklistService.createWarehouseLocationChecklist(
      warehouseLocationId,
      payload,
      user.id,
      submit,
    );
  }

  @ApiOperation({ summary: 'Update warehouse location checklist' })
  @ApiBearerAuth('JWT-auth')
  @Patch('/:id/key-submission-checklist')
  updateWarehouseLocationChecklist(
    @Param('id') warehouseLocationId: string,
    @Body() payload: CreateWarehouseLocationChecklistDto,
    @Query('submit') submitParam?: string,
    @Request() request?: any,
  ) {
    const user = request?.user as User;
    if (!user) {
      throw new BadRequestException('User not found in request');
    }
    const submit = submitParam === 'true' || submitParam === '1';
    return this.warehouseLocationChecklistService.updateWarehouseLocationChecklist(
      warehouseLocationId,
      payload,
      user.id,
      submit,
    );
  }
}


