import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateAssessmentSubSectionDto } from './dto/create-assessment-sub-section.dto';
import { UpdateAssessmentSubSectionDto } from './dto/update-assessment-sub-section.dto';
import { QueryAssessmentSubSectionDto } from './dto/query-assessment-sub-section.dto';
import { AssessmentSubSection } from './entities/assessment-sub-section.entity';
import { ExpertAssessment } from '../entities/expert-assessment.entity';

@Injectable()
export class AssessmentSubSectionService {
  constructor(
    @InjectRepository(AssessmentSubSection)
    private readonly assessmentSubSectionRepository: Repository<AssessmentSubSection>,
    @InjectRepository(ExpertAssessment)
    private readonly expertAssessmentRepository: Repository<ExpertAssessment>,
  ) { }

  async create(createAssessmentSubSectionDto: CreateAssessmentSubSectionDto): Promise<AssessmentSubSection> {
    // Verify that the parent assessment exists
    const assessment = await this.expertAssessmentRepository.findOne({
      where: { id: createAssessmentSubSectionDto.assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(`Expert assessment with ID ${createAssessmentSubSectionDto.assessmentId} not found`);
    }

    const subSection = this.assessmentSubSectionRepository.create({
      ...createAssessmentSubSectionDto,
      order: createAssessmentSubSectionDto.order ?? 0,
      isActive: createAssessmentSubSectionDto.isActive ?? true,
    });

    return await this.assessmentSubSectionRepository.save(subSection);
  }

  async findAll(query: QueryAssessmentSubSectionDto): Promise<{
    data: AssessmentSubSection[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, assessmentId, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.assessmentSubSectionRepository
      .createQueryBuilder('subSection')
      .leftJoinAndSelect('subSection.assessment', 'assessment')
      .skip(skip)
      .take(limit)
      .orderBy('subSection.order', 'ASC')
      .addOrderBy('subSection.createdAt', 'ASC');

    if (assessmentId) {
      queryBuilder.andWhere('subSection.assessmentId = :assessmentId', { assessmentId });
    }

    if (search) {
      queryBuilder.andWhere('subSection.name ILIKE :search', { search: `%${search}%` });
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

  async findOne(id: string): Promise<AssessmentSubSection> {
    const subSection = await this.assessmentSubSectionRepository.findOne({
      where: { id },
      relations: ['assessment'],
    });

    if (!subSection) {
      throw new NotFoundException(`Assessment sub-section with ID ${id} not found`);
    }

    return subSection;
  }

  async findByAssessmentId(
    assessmentId: string,
    query?: QueryAssessmentSubSectionDto,
  ): Promise<{
    data: AssessmentSubSection[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    // Verify that the parent assessment exists
    const assessment = await this.expertAssessmentRepository.findOne({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(`Expert assessment with ID ${assessmentId} not found`);
    }

    const { page = 1, limit = 10, search } = query || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.assessmentSubSectionRepository
      .createQueryBuilder('subSection')
      .leftJoinAndSelect('subSection.assessment', 'assessment')
      .where('subSection.assessmentId = :assessmentId', { assessmentId })
      .skip(skip)
      .take(limit)
      .orderBy('subSection.order', 'ASC')
      .addOrderBy('subSection.createdAt', 'ASC');

    if (search) {
      queryBuilder.andWhere('subSection.name ILIKE :search', { search: `%${search}%` });
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

  async update(id: string, updateAssessmentSubSectionDto: UpdateAssessmentSubSectionDto): Promise<AssessmentSubSection> {
    const subSection = await this.findOne(id);

    // If assessmentId is being updated, verify the new assessment exists
    if (updateAssessmentSubSectionDto.assessmentId && updateAssessmentSubSectionDto.assessmentId !== subSection.assessmentId) {
      const assessment = await this.expertAssessmentRepository.findOne({
        where: { id: updateAssessmentSubSectionDto.assessmentId },
      });

      if (!assessment) {
        throw new NotFoundException(`Expert assessment with ID ${updateAssessmentSubSectionDto.assessmentId} not found`);
      }
    }

    Object.assign(subSection, updateAssessmentSubSectionDto);
    return await this.assessmentSubSectionRepository.save(subSection);
  }

  async remove(id: string): Promise<void> {
    const subSection = await this.findOne(id);
    await this.assessmentSubSectionRepository.remove(subSection);
  }
}
