import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WarehouseLocationService } from './warehouse-location.service';
import { CreateWarehouseLocationDto } from './dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse-location.dto';

@Controller('warehouse-location')
export class WarehouseLocationController {
  constructor(private readonly warehouseLocationService: WarehouseLocationService) {}

  @Post()
  create(@Body() createWarehouseLocationDto: CreateWarehouseLocationDto) {
    return this.warehouseLocationService.create(createWarehouseLocationDto);
  }

  @Get()
  findAll() {
    return this.warehouseLocationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehouseLocationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseLocationDto: UpdateWarehouseLocationDto) {
    return this.warehouseLocationService.update(+id, updateWarehouseLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseLocationService.remove(+id);
  }
}
