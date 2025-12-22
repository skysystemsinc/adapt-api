import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { AssessmentSubSectionRequest, AssessmentSubSectionRequestStatus, AssessmentSubSectionRequestAction } from './entities/assessment-sub-section-request.entity';
import { AssessmentSubSection } from './entities/assessment-sub-section.entity';
import { ExpertAssessment } from '../entities/expert-assessment.entity';
import { CreateAssessmentSubSectionRequestDto } from './dto/create-assessment-sub-section-request.dto';
import { ReviewAssessmentSubSectionRequestDto } from './dto/review-assessment-sub-section-request.dto';
import { AssessmentSubSectionRequestResponseDto } from './dto/assessment-sub-section-request-response.dto';
import { QueryAssessmentSubSectionRequestsDto } from './dto/query-assessment-sub-section-requests.dto';

@Injectable()
export class AssessmentSubSectionRequestsService {
  constructor(
    @InjectRepository(AssessmentSubSectionRequest)
    private readonly assessmentSubSectionRequestRepository: Repository<AssessmentSubSectionRequest>,
    @InjectRepository(AssessmentSubSection)
    private readonly assessmentSubSectionRepository: Repository<AssessmentSubSection>,
    @InjectRepository(ExpertAssessment)
    private readonly expertAssessmentRepository: Repository<ExpertAssessment>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create an assessment sub-section request for approval
   */
  async create(
    createDto: CreateAssessmentSubSectionRequestDto,
    requestedBy?: string,
  ): Promise<AssessmentSubSectionRequestResponseDto> {
    const isNewSubSection = !createDto.subSectionId;
    let subSection: AssessmentSubSection | null = null;
    let originalData: {
      name?: string;
      order?: number;
      isActive?: boolean;
    } | null = null;

    // Validate parent assessment exists
    const assessment = await this.expertAssessmentRepository.findOne({
      where: { id: createDto.assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(`Expert assessment with ID '${createDto.assessmentId}' not found`);
    }

    // If updating existing sub-section, verify it exists and get current state
    if (!isNewSubSection && createDto.subSectionId) {
      subSection = await this.assessmentSubSectionRepository.findOne({
        where: { id: createDto.subSectionId },
      });

      if (!subSection) {
        throw new NotFoundException(`Assessment sub-section with ID '${createDto.subSectionId}' not found`);
      }

      // Verify sub-section belongs to the specified assessment
      if (subSection.assessmentId !== createDto.assessmentId) {
        throw new BadRequestException('Sub-section does not belong to the specified assessment');
      }

      // Check for pending requests
      const pendingRequest = await this.assessmentSubSectionRequestRepository.findOne({
        where: {
          subSectionId: createDto.subSectionId,
          status: AssessmentSubSectionRequestStatus.PENDING,
        },
      });

      if (pendingRequest) {
        throw new BadRequestException(
          'This sub-section already has a pending request. Please resolve it before creating a new one.',
        );
      }

      // Store original values as JSON
      originalData = {
        name: subSection.name,
        order: subSection.order,
        isActive: subSection.isActive,
      };
    } else {
      // For CREATE, check if name already exists within the same assessment
      const existingSubSection = await this.assessmentSubSectionRepository.findOne({
        where: {
          assessmentId: createDto.assessmentId,
          name: createDto.name,
        },
      });

      if (existingSubSection) {
        throw new ConflictException(`Assessment sub-section with name "${createDto.name}" already exists in this assessment`);
      }

      // Also check pending requests with same name in same assessment
      const pendingRequestWithName = await this.assessmentSubSectionRequestRepository.findOne({
        where: {
          assessmentId: createDto.assessmentId,
          name: createDto.name,
          status: AssessmentSubSectionRequestStatus.PENDING,
        },
      });

      if (pendingRequestWithName) {
        throw new ConflictException(`A pending request already exists for sub-section with name "${createDto.name}" in this assessment`);
      }
    }

    // Determine action
    let action: AssessmentSubSectionRequestAction;
    if (createDto.action) {
      action = createDto.action as AssessmentSubSectionRequestAction;
    } else if (isNewSubSection) {
      action = AssessmentSubSectionRequestAction.CREATE;
    } else {
      action = AssessmentSubSectionRequestAction.UPDATE;
    }

    // Create request
    const request = this.assessmentSubSectionRequestRepository.create({
      subSectionId: createDto.subSectionId || null,
      assessmentId: createDto.assessmentId,
      name: createDto.name,
      order: createDto.order ?? 0,
      isActive: createDto.isActive ?? true,
      originalData,
      status: AssessmentSubSectionRequestStatus.PENDING,
      action,
      requestedBy: requestedBy || null,
    });

    const savedRequest = await this.assessmentSubSectionRequestRepository.save(request);
    return this.findOne(savedRequest.id);
  }

  /**
   * Get all assessment sub-section requests with pagination and search
   */
  async findAll(
    query: QueryAssessmentSubSectionRequestsDto,
  ): Promise<{
    data: AssessmentSubSectionRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.assessmentSubSectionRequestRepository
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
      plainToInstance(AssessmentSubSectionRequestResponseDto, req, {
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
   * Get a single assessment sub-section request by ID
   */
  async findOne(id: string): Promise<AssessmentSubSectionRequestResponseDto> {
    const request = await this.assessmentSubSectionRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Assessment sub-section request with ID '${id}' not found`);
    }

    return plainToInstance(AssessmentSubSectionRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Review (approve/reject) an assessment sub-section request
   */
  async review(
    id: string,
    reviewDto: ReviewAssessmentSubSectionRequestDto,
    reviewedBy: string,
  ): Promise<AssessmentSubSectionRequestResponseDto> {
    const request = await this.assessmentSubSectionRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Assessment sub-section request with ID '${id}' not found`);
    }

    if (request.status !== AssessmentSubSectionRequestStatus.PENDING) {
      throw new BadRequestException(
        `Assessment sub-section request is already ${request.status}. Only pending requests can be reviewed.`,
      );
    }

    // If approved, try to apply the changes first before updating status
    if (reviewDto.status === AssessmentSubSectionRequestStatus.APPROVED) {
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

    await this.assessmentSubSectionRequestRepository.save(request);

    return this.findOne(id);
  }

  /**
   * Apply approved request to the actual sub-section
   * Creates a new sub-section (if CREATE), updates existing (if UPDATE), or deletes (if DELETE)
   */
  private async applyApprovedRequest(request: AssessmentSubSectionRequest): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // Handle DELETE action
      if (request.action === AssessmentSubSectionRequestAction.DELETE) {
        if (!request.subSectionId) {
          throw new BadRequestException('Cannot delete sub-section: subSectionId is missing');
        }

        const subSectionToDelete = await manager.findOne(AssessmentSubSection, {
          where: { id: request.subSectionId },
        });

        if (!subSectionToDelete) {
          throw new NotFoundException(`Assessment sub-section with ID '${request.subSectionId}' not found`);
        }

        await manager.remove(subSectionToDelete);
        return;
      }

      const isNewSubSection = !request.subSectionId;

      if (isNewSubSection) {
        // Create new sub-section
        const newSubSection = manager.create(AssessmentSubSection, {
          assessmentId: request.assessmentId,
          name: request.name,
          order: request.order,
          isActive: request.isActive,
        });
        await manager.save(newSubSection);
      } else {
        // Update existing sub-section
        if (!request.subSectionId) {
          throw new BadRequestException('Cannot update sub-section: subSectionId is missing');
        }
        const subSectionId = request.subSectionId; // TypeScript now knows this is not null
        const existingSubSection = await manager.findOne(AssessmentSubSection, {
          where: { id: subSectionId },
        });

        if (!existingSubSection) {
          throw new NotFoundException(`Assessment sub-section with ID '${subSectionId}' not found`);
        }

        // Check for name conflicts within the same assessment
        if (request.name !== existingSubSection.name) {
          const nameConflict = await manager.findOne(AssessmentSubSection, {
            where: {
              assessmentId: request.assessmentId,
              name: request.name,
            },
          });

          if (nameConflict && nameConflict.id !== subSectionId) {
            throw new ConflictException(`Assessment sub-section with name "${request.name}" already exists in this assessment`);
          }
        }

        existingSubSection.name = request.name;
        existingSubSection.order = request.order;
        existingSubSection.isActive = request.isActive;

        await manager.save(existingSubSection);
      }
    });
  }

  /**
   * Delete an assessment sub-section request
   */
  async remove(id: string): Promise<{ message: string }> {
    const request = await this.assessmentSubSectionRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Assessment sub-section request with ID '${id}' not found`);
    }

    await this.assessmentSubSectionRequestRepository.remove(request);

    return { message: `Assessment sub-section request with ID '${id}' has been deleted successfully` };
  }
}
