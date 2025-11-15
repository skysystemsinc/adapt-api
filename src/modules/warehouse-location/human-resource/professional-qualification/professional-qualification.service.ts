import { Injectable } from '@nestjs/common';
import { CreateProfessionalQualificationDto } from './dto/create-professional-qualification.dto';
import { UpdateProfessionalQualificationDto } from './dto/update-professional-qualification.dto';

@Injectable()
export class ProfessionalQualificationService {
  create(createProfessionalQualificationDto: CreateProfessionalQualificationDto) {
    return 'This action adds a new professionalQualification';
  }

  findAll() {
    return `This action returns all professionalQualification`;
  }

  findOne(id: number) {
    return `This action returns a #${id} professionalQualification`;
  }

  update(id: number, updateProfessionalQualificationDto: UpdateProfessionalQualificationDto) {
    return `This action updates a #${id} professionalQualification`;
  }

  remove(id: number) {
    return `This action removes a #${id} professionalQualification`;
  }
}
