import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateReviewDto, ReviewType } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { ReviewEntity } from './entities/review.entity';
import { AssessmentDecision, AssessmentDetailsEntity } from './entities/assessment_details.entity';
import { PaginationQueryDto } from '../../expert-assessment/assessment-sub-section/dto/pagination-query.dto';
import { Permissions } from '../../rbac/constants/permissions.constants';
import { UsersService } from '../../users/users.service';
import { hasPermission } from 'src/common/utils/helper.utils';
import { User } from '../../users/entities/user.entity';
import { WarehouseOperatorApplicationStatus } from '../entities/warehouse-operator-application-request.entity';
import { WarehouseOperatorApplicationRequest } from '../entities/warehouse-operator-application-request.entity';
import { WarehouseOperator } from '../entities/warehouse-operator.entity';

const REQUIRED_ASSESSMENT_TYPES: ReviewType[] = [
  ReviewType.HR,
  ReviewType.FINANCIAL,
  ReviewType.LEGAL,
  ReviewType.SECURITY,
  ReviewType.TECHNICAL,
  ReviewType.ECG,
];

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(AssessmentDetailsEntity)
    private readonly assessmentDetailsRepository: Repository<AssessmentDetailsEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorApplicationRequestRepository: Repository<WarehouseOperatorApplicationRequest>,
    @InjectRepository(WarehouseOperator)
    private readonly warehouseOperatorRepository: Repository<WarehouseOperator>,
  ) { }
  async create(applicationId: string, assessmentId: string, createReviewDto: CreateReviewDto, userId: string) {
    let decision: AssessmentDecision = AssessmentDecision.ACCEPTED;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        userRoles: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const reviewApplication = await this.reviewRepository.findOne({
      where: 
        [
        {applicationId: applicationId},
        {applicationLocationId: applicationId},
      ],
      select: {
        id: true,
        applicationId: true,
        applicationLocationId: true,
      },
    });

    const isLocationReview = reviewApplication?.applicationLocationId === applicationId;

    return await this.dataSource.transaction(async (manager) => {
      const reviewRepository = manager.getRepository(ReviewEntity);
      const assessmentDetailsRepository = manager.getRepository(AssessmentDetailsEntity);

      const review = await reviewRepository.findOne({
        where: {
          id: assessmentId,
          ...(isLocationReview ? { applicationLocationId: applicationId } : { applicationId }),
        },
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      if (!createReviewDto.assessments || createReviewDto.assessments.length === 0) {
        throw new BadRequestException('At least one assessment is required');
      }

      // Validate that all required assessment types are provided
      const providedTypes = createReviewDto.assessments.map(a => a.type);
      const missingTypes = REQUIRED_ASSESSMENT_TYPES.filter(
        type => !providedTypes.includes(type)
      );

      if (missingTypes.length > 0) {
        throw new BadRequestException(
          `All assessment types are required. Missing types: ${missingTypes.join(', ')}`
        );
      }

      // Validate that there are no duplicate assessment types
      const duplicateTypes = providedTypes.filter(
        (type, index) => providedTypes.indexOf(type) !== index
      );

      if (duplicateTypes.length > 0) {
        const uniqueDuplicates = [...new Set(duplicateTypes)];
        throw new BadRequestException(
          `Duplicate assessment types found: ${uniqueDuplicates.join(', ')}. Each assessment type must be provided exactly once.`
        );
      }

      // Validate that exactly 6 assessments are provided
      if (createReviewDto.assessments.length !== REQUIRED_ASSESSMENT_TYPES.length) {
        throw new BadRequestException(
          `Exactly ${REQUIRED_ASSESSMENT_TYPES.length} assessments are required (one for each type: ${REQUIRED_ASSESSMENT_TYPES.join(', ')}). Provided: ${createReviewDto.assessments.length}`
        );
      }

      for (const assessment of createReviewDto.assessments) {
        // If any assessment is rejected, the decision is rejected
        if (assessment.decision == AssessmentDecision.REJECTED) decision = AssessmentDecision.REJECTED;

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
      if (createReviewDto.fullName) {
        review.fullName = createReviewDto.fullName;
      }
      if (createReviewDto.designation) {
        review.designation = createReviewDto.designation;
      }
      if (createReviewDto.dateOfAssessment) {
        review.dateOfAssessment = createReviewDto.dateOfAssessment;
      }
      if (createReviewDto.accreditationGrade) {
        review.accreditationGrade = createReviewDto.accreditationGrade;
      }

      await reviewRepository.save(review);

      // If LogedIn User is not CEO
      if (!hasPermission(user, Permissions.REVIEW_FINAL_APPLICATION)) {
        // user with permission "REVIEW_FINAL_APPLICATION"
        const ceoUser = await this.usersService.findByPermission(Permissions.REVIEW_FINAL_APPLICATION);

        // Only create CEO review if a CEO user exists
        if (ceoUser && ceoUser.length > 0 && ceoUser[0]?.id) {
          const ceoReview = reviewRepository.create({
            applicationId: review.applicationId,
            applicationLocationId: review.applicationLocationId,
            type: 'CEO',
            isSubmitted: true,
            userId: ceoUser[0].id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await reviewRepository.save(ceoReview);
        }
      }

      // If CEO has approved the application:
      // 1- update the application status
      let application: WarehouseOperatorApplicationRequest | undefined | null;
      if (hasPermission(user, Permissions.REVIEW_FINAL_APPLICATION)) {
        application = await this.warehouseOperatorApplicationRequestRepository.findOne({
          where: { id: applicationId },
        });

        if(!application) {
          throw new NotFoundException('Application not found');
        }

        application.status = decision == AssessmentDecision.REJECTED ? WarehouseOperatorApplicationStatus.REJECTED : WarehouseOperatorApplicationStatus.APPROVED;
        await this.warehouseOperatorApplicationRequestRepository.save(application);

        // TODO: send email to the user

        if (decision == AssessmentDecision.ACCEPTED) {
          const warehouseOperator = await this.warehouseOperatorRepository.create({
            applicationId,
            userId: application.userId,
            approvedByFullName: review.fullName ?? undefined,
            approvedByDesignation: review.designation ?? undefined,
            dateOfAssessment: review.dateOfAssessment ?? undefined,
            operatorCode: application.applicationId,
            approvedBy: user.id,
            accreditationGrade: review.accreditationGrade,
          });
          await this.warehouseOperatorRepository.save(warehouseOperator);
        }

      }
      return review;
    });
  }

  async findAllPaginated(query: PaginationQueryDto, userId: string) {
    // Get user permissions
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        userRoles: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
        // organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const { page = 1, limit = 10 , type = 'operator' } = query;
    const skip = (page - 1) * limit;
    const [data, total] = await this.reviewRepository.findAndCount({
      where: {
        isSubmitted: true,
        type: hasPermission(user, Permissions.REVIEW_FINAL_APPLICATION) ? 'CEO' : 'HOD',
        ...(type == 'location' ? { applicationLocationId: Not(IsNull()) } : { applicationLocationId: IsNull() }),
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

  async findOne(applicationId: string, assessmentId: string, userId: string) {
    const assessment = await this.reviewRepository.findOne({
      where: { applicationId, type: 'HOD' },
      relations: ['application', 'applicationLocation', 'user', 'details'],
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    return assessment;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
