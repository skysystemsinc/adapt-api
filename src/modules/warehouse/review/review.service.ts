import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReviewEntity } from './entities/review.entity';
import { AssessmentDetailsEntity } from './entities/assessment_details.entity';
import { PaginationQueryDto } from '../../expert-assessment/assessment-sub-section/dto/pagination-query.dto';
import { Permissions } from '../../rbac/constants/permissions.constants';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(AssessmentDetailsEntity)
    private readonly assessmentDetailsRepository: Repository<AssessmentDetailsEntity>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) { }
  async create(applicationId: string, assessmentId: string, createReviewDto: CreateReviewDto, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const reviewRepository = manager.getRepository(ReviewEntity);
      const assessmentDetailsRepository = manager.getRepository(AssessmentDetailsEntity);

      const review = await reviewRepository.findOne({
        where: {
          id: assessmentId,
          applicationId,
        },
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      if (!createReviewDto.assessments || createReviewDto.assessments.length === 0) {
        throw new BadRequestException('At least one assessment is required');
      }

      for (const assessment of createReviewDto.assessments) {
        const existingAssessmentDetail = await assessmentDetailsRepository.findOne({
          where: {
            submissionId: assessment.assessmentSubmissionId,
            assessmentId,
          },
        });
        if (existingAssessmentDetail) {
          throw new BadRequestException(
            `Assessment detail already submitted for submission ID: ${assessment.assessmentSubmissionId}`
          );
        }
        const assessmentDetail = assessmentDetailsRepository.create({
          submissionId: assessment.assessmentSubmissionId,
          assessmentId,
          type: assessment.type,
          decision: assessment.decision,
          score: assessment.score,
          remarks: assessment.remarks,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await assessmentDetailsRepository.save(assessmentDetail);
      }

      review.userId = userId;
      await reviewRepository.save(review);

      // user with permission "REVIEW_FINAL_APPLICATION"
      const ceoUser = await this.usersService.findByPermission(Permissions.REVIEW_FINAL_APPLICATION);
      
      // Only create CEO review if a CEO user exists
      if (ceoUser && ceoUser.length > 0 && ceoUser[0]?.id) {
        const ceoReview = reviewRepository.create({
          applicationId: review.applicationId,
          applicationLocationId: review.applicationLocationId,
          type: 'CEO',
          userId: ceoUser[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await reviewRepository.save(ceoReview);
      }
      return review;
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

  async findOne(id: string) {
    return await this.reviewRepository.findOne({
      where: { id },
      relations: ['application', 'applicationLocation', 'user', 'details'],
    });
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
