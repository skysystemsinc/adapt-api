import { Injectable } from '@nestjs/common';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';

@Injectable()
export class WeighingsService {
  create(createWeighingDto: CreateWeighingDto) {
    return 'This action adds a new weighing';
  }

  findAll() {
    return `This action returns all weighings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} weighing`;
  }

  update(id: number, updateWeighingDto: UpdateWeighingDto) {
    return `This action updates a #${id} weighing`;
  }

  remove(id: number) {
    return `This action removes a #${id} weighing`;
  }
}
