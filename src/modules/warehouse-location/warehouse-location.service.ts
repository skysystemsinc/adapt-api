import { Injectable } from '@nestjs/common';
import { CreateWarehouseLocationDto } from './dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse-location.dto';

@Injectable()
export class WarehouseLocationService {
  create(createWarehouseLocationDto: CreateWarehouseLocationDto) {
    return 'This action adds a new warehouseLocation';
  }

  findAll() {
    return `This action returns all warehouseLocation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} warehouseLocation`;
  }

  update(id: number, updateWarehouseLocationDto: UpdateWarehouseLocationDto) {
    return `This action updates a #${id} warehouseLocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouseLocation`;
  }
}
