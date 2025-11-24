import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeclarationDto } from './dto/create-declaration.dto';
import { Declaration } from './entities/declaration.entity';
import { HumanResource } from '../entities/human-resource.entity';

@Injectable()
export class DeclarationService {
  constructor(
    @InjectRepository(Declaration)
    private readonly declarationRepository: Repository<Declaration>,
    @InjectRepository(HumanResource)
    private readonly humanResourceRepository: Repository<HumanResource>,
  ) {}

  async createOrUpdate(hrId: string, createDeclarationDto: CreateDeclarationDto) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
      relations: ['declaration'],
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    if (humanResource.declaration) {
      // Update existing declaration
      Object.assign(humanResource.declaration, createDeclarationDto);
      return this.declarationRepository.save(humanResource.declaration);
    } else {
      // Create new declaration
      const declaration = this.declarationRepository.create({
        humanResourceId: hrId,
        ...createDeclarationDto,
      });
      return this.declarationRepository.save(declaration);
    }
  }

  async findByHrId(hrId: string) {
    return this.declarationRepository.findOne({
      where: { humanResourceId: hrId },
    });
  }
}

