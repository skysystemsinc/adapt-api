import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateExpertAssessmentDto } from './dto/create-expert-assessment.dto';
import { UpdateExpertAssessmentDto } from './dto/update-expert-assessment.dto';
import { QueryExpertAssessmentDto } from './dto/query-expert-assessment.dto';
import { ExpertAssessment } from './entities/expert-assessment.entity';

@Injectable()
export class ExpertAssessmentService {
  constructor(
    @InjectRepository(ExpertAssessment)
    private readonly expertAssessmentRepository: Repository<ExpertAssessment>,
  ) {}

  async create(createExpertAssessmentDto: CreateExpertAssessmentDto, userId?: string): Promise<ExpertAssessment> {
    // Check if assessment with this name already exists
    const existingAssessment = await this.expertAssessmentRepository.findOne({
      where: { name: createExpertAssessmentDto.name },
    });

    if (existingAssessment) {
      throw new ConflictException(`Expert assessment with name "${createExpertAssessmentDto.name}" already exists`);
    }

    const assessment = this.expertAssessmentRepository.create({
      ...createExpertAssessmentDto,
      createdBy: userId,
      isActive: createExpertAssessmentDto.isActive ?? true,
    });

    try {
      return await this.expertAssessmentRepository.save(assessment);
    } catch (error: any) {
      // Handle database unique constraint violation as fallback
      if (error.code === '23505' || error.message?.includes('unique')) {
        throw new ConflictException(`Expert assessment with name "${createExpertAssessmentDto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll(query: QueryExpertAssessmentDto): Promise<{
    data: ExpertAssessment[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, category, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.expertAssessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.createdByUser', 'createdByUser')
      .skip(skip)
      .take(limit)
      .orderBy('assessment.createdAt', 'DESC');

    if (category) {
      queryBuilder.andWhere('assessment.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere('assessment.name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ExpertAssessment> {
    const assessment = await this.expertAssessmentRepository.findOne({
      where: { id },
      relations: ['createdByUser', 'submissions'],
    });

    if (!assessment) {
      throw new NotFoundException(`Expert assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async findByCategory(category: string, query: QueryExpertAssessmentDto): Promise<{
    data: ExpertAssessment[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.expertAssessmentRepository
      .createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.createdByUser', 'createdByUser')
      .where('assessment.category = :category', { category })
      .andWhere('assessment.isActive = :isActive', { isActive: true })
      .skip(skip)
      .take(limit)
      .orderBy('assessment.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere('assessment.name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateExpertAssessmentDto: UpdateExpertAssessmentDto): Promise<ExpertAssessment> {
    const assessment = await this.findOne(id);

    // If name is being updated, check for duplicates
    if (updateExpertAssessmentDto.name && updateExpertAssessmentDto.name !== assessment.name) {
      const existingAssessment = await this.expertAssessmentRepository.findOne({
        where: { name: updateExpertAssessmentDto.name },
      });

      if (existingAssessment && existingAssessment.id !== id) {
        throw new ConflictException(`Expert assessment with name "${updateExpertAssessmentDto.name}" already exists`);
      }
    }

    Object.assign(assessment, updateExpertAssessmentDto);

    try {
      return await this.expertAssessmentRepository.save(assessment);
    } catch (error: any) {
      // Handle database unique constraint violation as fallback
      if (error.code === '23505' || error.message?.includes('unique')) {
        throw new ConflictException(`Expert assessment with name "${updateExpertAssessmentDto.name}" already exists`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const assessment = await this.findOne(id);
    await this.expertAssessmentRepository.remove(assessment);
  }
}
