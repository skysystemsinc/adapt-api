import { Injectable } from '@nestjs/common';
import { CreateAcademicQualificationDto } from './dto/create-academic-qualification.dto';
import { UpdateAcademicQualificationDto } from './dto/update-academic-qualification.dto';

@Injectable()
export class AcademicQualificationService {
  create(createAcademicQualificationDto: CreateAcademicQualificationDto) {
    return 'This action adds a new academicQualification';
  }

  findAll() {
    return `This action returns all academicQualification`;
  }

  findOne(id: number) {
    return `This action returns a #${id} academicQualification`;
  }

  update(id: number, updateAcademicQualificationDto: UpdateAcademicQualificationDto) {
    return `This action updates a #${id} academicQualification`;
  }

  remove(id: number) {
    return `This action removes a #${id} academicQualification`;
  }
}
