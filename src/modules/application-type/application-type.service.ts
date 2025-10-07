import { Injectable } from '@nestjs/common';
import { ApplicationTypeResponseDto } from './dto/application-type-response.dto';
import { ApplicationType } from './entities/application-type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ApplicationTypeService {
  constructor(
    @InjectRepository(ApplicationType)
    private applicationTypeRepository: Repository<ApplicationType>,
  ) {}

  async findAll(): Promise<ApplicationTypeResponseDto[]> {
    const applicationTypes = await this.applicationTypeRepository.find();
    return plainToInstance(ApplicationTypeResponseDto, applicationTypes, {
      excludeExtraneousValues: true, // Only include fields marked with @Expose()
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} applicationType`;
  }

  remove(id: number) {
    return `This action removes a #${id} applicationType`;
  }
}
