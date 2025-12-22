import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { ExpertAssessmentRequest, ExpertAssessmentRequestStatus, ExpertAssessmentRequestAction } from './entities/expert-assessment-request.entity';
import { AssessmentCategory, ExpertAssessment } from './entities/expert-assessment.entity';
import { CreateExpertAssessmentRequestDto } from './dto/create-expert-assessment-request.dto';
import { ReviewExpertAssessmentRequestDto } from './dto/review-expert-assessment-request.dto';
import { ExpertAssessmentRequestResponseDto } from './dto/expert-assessment-request-response.dto';
import { QueryExpertAssessmentRequestsDto } from './dto/query-expert-assessment-requests.dto';

@Injectable()
export class ExpertAssessmentRequestsService {
  constructor(
    @InjectRepository(ExpertAssessmentRequest)
    private readonly expertAssessmentRequestRepository: Repository<ExpertAssessmentRequest>,
    @InjectRepository(ExpertAssessment)
    private readonly expertAssessmentRepository: Repository<ExpertAssessment>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create an expert assessment request for approval
   */
  async create(
    createDto: CreateExpertAssessmentRequestDto,
    requestedBy?: string,
  ): Promise<ExpertAssessmentRequestResponseDto> {
    const isNewAssessment = !createDto.assessmentId;
    let assessment: ExpertAssessment | null = null;
    let originalData: {
      name?: string;
      category?: AssessmentCategory;
      isActive?: boolean;
    } | null = null;

    // If updating existing assessment, verify it exists and get current state
    if (!isNewAssessment && createDto.assessmentId) {
      assessment = await this.expertAssessmentRepository.findOne({
        where: { id: createDto.assessmentId },
      });

      if (!assessment) {
        throw new NotFoundException(`Expert assessment with ID '${createDto.assessmentId}' not found`);
      }

      // Check for pending requests
      const pendingRequest = await this.expertAssessmentRequestRepository.findOne({
        where: {
          assessmentId: createDto.assessmentId,
          status: ExpertAssessmentRequestStatus.PENDING,
        },
      });

      if (pendingRequest) {
        throw new BadRequestException(
          'This assessment already has a pending request. Please resolve it before creating a new one.',
        );
      }

      // Store original values as JSON
      originalData = {
        name: assessment.name,
        category: assessment.category,
        isActive: assessment.isActive,
      };
    } else {
      // For CREATE, check if name already exists
      const existingAssessment = await this.expertAssessmentRepository.findOne({
        where: { name: createDto.name },
      });

      if (existingAssessment) {
        throw new ConflictException(`Expert assessment with name "${createDto.name}" already exists`);
      }

      // Also check pending requests with same name
      const pendingRequestWithName = await this.expertAssessmentRequestRepository.findOne({
        where: {
          name: createDto.name,
          status: ExpertAssessmentRequestStatus.PENDING,
        },
      });

      if (pendingRequestWithName) {
        throw new ConflictException(`A pending request already exists for assessment with name "${createDto.name}"`);
      }
    }

    // Determine action
    let action: ExpertAssessmentRequestAction;
    if (createDto.action) {
      action = createDto.action as ExpertAssessmentRequestAction;
    } else if (isNewAssessment) {
      action = ExpertAssessmentRequestAction.CREATE;
    } else {
      action = ExpertAssessmentRequestAction.UPDATE;
    }

    // Create request
    const request = this.expertAssessmentRequestRepository.create({
      assessmentId: createDto.assessmentId || null,
      name: createDto.name,
      category: createDto.category,
      isActive: createDto.isActive ?? true,
      originalData,
      status: ExpertAssessmentRequestStatus.PENDING,
      action,
      requestedBy: requestedBy || null,
    });

    const savedRequest = await this.expertAssessmentRequestRepository.save(request);
    return this.findOne(savedRequest.id);
  }

  /**
   * Get all expert assessment requests with pagination and search
   */
  async findAll(
    query: QueryExpertAssessmentRequestsDto,
  ): Promise<{
    data: ExpertAssessmentRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.expertAssessmentRequestRepository
      .createQueryBuilder('request')
      .skip(skip)
      .take(limit)
      .orderBy('request.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere('request.name ILIKE :search', { search: `%${search}%` });
    }

    const [requests, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    const data = requests.map((req) =>
      plainToInstance(ExpertAssessmentRequestResponseDto, req, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get a single expert assessment request by ID
   */
  async findOne(id: string): Promise<ExpertAssessmentRequestResponseDto> {
    const request = await this.expertAssessmentRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Expert assessment request with ID '${id}' not found`);
    }

    return plainToInstance(ExpertAssessmentRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Review (approve/reject) an expert assessment request
   */
  async review(
    id: string,
    reviewDto: ReviewExpertAssessmentRequestDto,
    reviewedBy: string,
  ): Promise<ExpertAssessmentRequestResponseDto> {
    const request = await this.expertAssessmentRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Expert assessment request with ID '${id}' not found`);
    }

    if (request.status !== ExpertAssessmentRequestStatus.PENDING) {
      throw new BadRequestException(
        `Expert assessment request is already ${request.status}. Only pending requests can be reviewed.`,
      );
    }

    // If approved, try to apply the changes first before updating status
    if (reviewDto.status === ExpertAssessmentRequestStatus.APPROVED) {
      try {
        await this.applyApprovedRequest(request);
      } catch (error) {
        // If applying changes fails, keep status as PENDING and rethrow the error
        throw error;
      }
    }

    // Only update status if we got here (either rejected, or approved and changes applied successfully)
    request.status = reviewDto.status;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewDto.reviewNotes || null;

    await this.expertAssessmentRequestRepository.save(request);

    return this.findOne(id);
  }

  /**
   * Apply approved request to the actual assessment
   * Creates a new assessment (if CREATE), updates existing (if UPDATE), or deletes (if DELETE)
   */
  private async applyApprovedRequest(request: ExpertAssessmentRequest): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // Handle DELETE action
      if (request.action === ExpertAssessmentRequestAction.DELETE) {
        if (!request.assessmentId) {
          throw new BadRequestException('Cannot delete assessment: assessmentId is missing');
        }

        const assessmentToDelete = await manager.findOne(ExpertAssessment, {
          where: { id: request.assessmentId },
          relations: ['subSections', 'submissions'],
        });

        if (!assessmentToDelete) {
          throw new NotFoundException(`Expert assessment with ID '${request.assessmentId}' not found`);
        }

        // Check if assessment has sub-sections or submissions
        if (assessmentToDelete.subSections && assessmentToDelete.subSections.length > 0) {
          throw new BadRequestException(
            `Cannot delete assessment: ${assessmentToDelete.subSections.length} sub-section(s) exist. Please delete sub-sections first.`
          );
        }

        if (assessmentToDelete.submissions && assessmentToDelete.submissions.length > 0) {
          throw new BadRequestException(
            `Cannot delete assessment: ${assessmentToDelete.submissions.length} submission(s) exist. Please delete submissions first.`
          );
        }

        await manager.remove(assessmentToDelete);
        return;
      }

      const isNewAssessment = !request.assessmentId;

      if (isNewAssessment) {
        // Create new assessment
        const newAssessment = manager.create(ExpertAssessment, {
          name: request.name,
          category: request.category,
          isActive: request.isActive,
        });
        await manager.save(newAssessment);
      } else {
        // Update existing assessment
        if (!request.assessmentId) {
          throw new BadRequestException('Cannot update assessment: assessmentId is missing');
        }
        const assessmentId = request.assessmentId; // TypeScript now knows this is not null
        const existingAssessment = await manager.findOne(ExpertAssessment, {
          where: { id: assessmentId },
        });

        if (!existingAssessment) {
          throw new NotFoundException(`Expert assessment with ID '${request.assessmentId}' not found`);
        }

        // Check for name conflicts
        if (request.name !== existingAssessment.name) {
          const nameConflict = await manager.findOne(ExpertAssessment, {
            where: { name: request.name },
          });

          if (nameConflict && nameConflict.id !== assessmentId) {
            throw new ConflictException(`Expert assessment with name "${request.name}" already exists`);
          }
        }

        existingAssessment.name = request.name;
        existingAssessment.category = request.category;
        existingAssessment.isActive = request.isActive;

        await manager.save(existingAssessment);
      }
    });
  }

  /**
   * Delete an expert assessment request
   */
  async remove(id: string): Promise<{ message: string }> {
    const request = await this.expertAssessmentRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Expert assessment request with ID '${id}' not found`);
    }

    await this.expertAssessmentRequestRepository.remove(request);

    return { message: `Expert assessment request with ID '${id}' has been deleted successfully` };
  }
}
