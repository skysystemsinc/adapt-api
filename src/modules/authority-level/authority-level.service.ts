import { Injectable } from '@nestjs/common';
import { AuthorityLevelResponseDto } from './dto/authority-level-response.dto';
import { AuthorityLevel } from './entities/authority-level.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateAuthorityLevelDto } from './dto/create-authority-level.dto';
import { UpdateAuthorityLevelDto } from './dto/update-authority-level.dto';

@Injectable()
export class AuthorityLevelService {
  constructor(
    @InjectRepository(AuthorityLevel)
    private authorityLevelRepository: Repository<AuthorityLevel>,
  ) { }

  async findAll(): Promise<AuthorityLevelResponseDto[]> {
    const authorityLevels = await this.authorityLevelRepository.find();
    return plainToInstance(AuthorityLevelResponseDto, authorityLevels, {
      excludeExtraneousValues: true,
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} AuthorityLevel`;
  }

  remove(id: string) {
    return `This action removes a #${id} AuthorityLevel`;
  }
}
