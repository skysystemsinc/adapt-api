import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { WarehouseAdminService } from './warehouse-admin.service';
import { CreateWarehouseAdminDto } from './dto/create-warehouse-admin.dto';
import { UpdateWarehouseAdminDto } from './dto/update-warehouse-admin.dto';
import { QueryOperatorApplicationDto } from './dto/query-operator-application.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('warehouse-admin')
export class WarehouseAdminController {
  constructor(private readonly warehouseAdminService: WarehouseAdminService) {}

  @Post()
  create(@Body() createWarehouseAdminDto: CreateWarehouseAdminDto) {
    return this.warehouseAdminService.create(createWarehouseAdminDto);
  }

  @Get('/application/operators')
  findAllWareHouseOperators(@Query() query: QueryOperatorApplicationDto) {
    return this.warehouseAdminService.findAllWareHouseOperatorsPaginated(query);
  }

  @Get('/application/:id/operators')
  findOneWareHouseOperator(@Param('id') id: string) {
    return this.warehouseAdminService.findOne(id);
  }

  @Get('/application/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all warehouse roles' })
  findAllWareHouseRoles(
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.warehouseAdminService.findAllWareHouseRoles(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseAdminDto: UpdateWarehouseAdminDto) {
    return this.warehouseAdminService.update(+id, updateWarehouseAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseAdminService.remove(+id);
  }
}
