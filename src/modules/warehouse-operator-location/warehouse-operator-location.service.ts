import { Injectable } from '@nestjs/common';
import { CreateWarehouseOperatorLocationDto } from './dto/create-warehouse-operator-location.dto';
import { UpdateWarehouseOperatorLocationDto } from './dto/update-warehouse-operator-location.dto';

@Injectable()
export class WarehouseOperatorLocationService {
  create(createWarehouseOperatorLocationDto: CreateWarehouseOperatorLocationDto) {
    return 'This action adds a new warehouseOperatorLocation';
  }

  findAll() {
    return `This action returns all warehouseOperatorLocation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} warehouseOperatorLocation`;
  }

  update(id: number, updateWarehouseOperatorLocationDto: UpdateWarehouseOperatorLocationDto) {
    return `This action updates a #${id} warehouseOperatorLocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouseOperatorLocation`;
  }
}
