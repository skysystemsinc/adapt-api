import { Injectable } from '@nestjs/common';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';

@Injectable()
export class JurisdictionService {
  create(createJurisdictionDto: CreateJurisdictionDto) {
    return 'This action adds a new jurisdiction';
  }

  findAll() {
    return `This action returns all jurisdiction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} jurisdiction`;
  }

  update(id: number, updateJurisdictionDto: UpdateJurisdictionDto) {
    return `This action updates a #${id} jurisdiction`;
  }

  remove(id: number) {
    return `This action removes a #${id} jurisdiction`;
  }
}
