import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from './entities/review.entity';
import { AssessmentDetailsEntity } from './entities/assessment_details.entity';
import { InspectionReport } from 'src/modules/inspection-reports/entities/inspection-report.entity';
import { PaginationQueryDto } from 'src/modules/expert-assessment/assessment-sub-section/dto/pagination-query.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(AssessmentDetailsEntity)
    private readonly assessmentDetailsRepository: Repository<AssessmentDetailsEntity>,
    @InjectRepository(InspectionReport)
    private readonly inspectionReportRepository: Repository<InspectionReport>,
  ) {}
  async create(applicationId: string, assessmentId: string, createReviewDto: CreateReviewDto, userId: string) {
    const review = await this.reviewRepository.findOne({
      where: {
        id: assessmentId,
        applicationId,
        userId,
      },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const assessmentDetail = await this.assessmentDetailsRepository.findOne({
      where: {
        submissionId: createReviewDto.assessmentSubmissionId,
        assessmentId: assessmentId,
      },
    });

    if (assessmentDetail) {
      throw new BadRequestException('Assessment detail already submitted');
    }

    return await this.assessmentDetailsRepository.save({
      assessmentId,
      submissionId: createReviewDto.assessmentSubmissionId,
      type: createReviewDto.type,
      decision: createReviewDto.decision,
      score: createReviewDto.score,
      remarks: createReviewDto.remarks,
    });
  }

  async findAllPaginated(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const [data, total] = await this.reviewRepository.findAndCount({
      where: {
        isSubmitted: true,
        type: 'HOD',
      },
      relations: ['application', 'applicationLocation', 'user', 'details'],
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });
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

  findOne(id: number) {
    return `This action returns a #${id} review`;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
