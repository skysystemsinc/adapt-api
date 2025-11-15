import { Injectable } from '@nestjs/common';
import { CreateFireSafetyDto } from './dto/create-fire-safety.dto';
import { UpdateFireSafetyDto } from './dto/update-fire-safety.dto';

@Injectable()
export class FireSafetyService {
  create(createFireSafetyDto: CreateFireSafetyDto) {
    return 'This action adds a new fireSafety';
  }

  findAll() {
    return `This action returns all fireSafety`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fireSafety`;
  }

  update(id: number, updateFireSafetyDto: UpdateFireSafetyDto) {
    return `This action updates a #${id} fireSafety`;
  }

  remove(id: number) {
    return `This action removes a #${id} fireSafety`;
  }
}
