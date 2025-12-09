import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WarehouseOperatorLocationService } from './warehouse-operator-location.service';
import { CreateWarehouseOperatorLocationDto } from './dto/create-warehouse-operator-location.dto';
import { UpdateWarehouseOperatorLocationDto } from './dto/update-warehouse-operator-location.dto';

@Controller('warehouse-operator-location')
export class WarehouseOperatorLocationController {
  constructor(private readonly warehouseOperatorLocationService: WarehouseOperatorLocationService) {}

  @Post()
  create(@Body() createWarehouseOperatorLocationDto: CreateWarehouseOperatorLocationDto) {
    return this.warehouseOperatorLocationService.create(createWarehouseOperatorLocationDto);
  }

  @Get()
  findAll() {
    return this.warehouseOperatorLocationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehouseOperatorLocationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseOperatorLocationDto: UpdateWarehouseOperatorLocationDto) {
    return this.warehouseOperatorLocationService.update(+id, updateWarehouseOperatorLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseOperatorLocationService.remove(+id);
  }
}
