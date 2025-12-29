import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Not } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { UserRequest, UserRequestStatus, UserRequestAction, SuperAdminRequestStatus } from '../entities/user-request.entity';
import { User } from '../entities/user.entity';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { ReviewUserRequestDto } from '../dto/review-user-request.dto';
import { UserRequestResponseDto } from '../dto/user-request-response.dto';
import { RBACService } from '../../rbac/services/rbac.service';
import { UserRole } from '../../rbac/entities/user-role.entity';
import { Role } from '../../rbac/entities/role.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { hasPermission } from 'src/common/utils/helper.utils';
import { Permissions } from 'src/modules/rbac/constants/permissions.constants';
import { QueryUserRequestsDto } from '../dto/query-user-requests.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRequestsService {
  private readonly logger = new Logger(UserRequestsService.name);

  constructor(
    @InjectRepository(UserRequest)
    private readonly userRequestRepository: Repository<UserRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly rbacService: RBACService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Create a user request for approval
   */
  async create(
    createDto: CreateUserRequestDto,
    requestedBy?: string,
  ): Promise<UserRequestResponseDto> {
    const isNewUser = !createDto.userId;
    let user: User | null = null;

    // Validate existing user for UPDATE / DELETE
    if (!isNewUser && createDto.userId) {
      user = await this.userRepository.findOne({
        where: { id: createDto.userId },
        relations: ['userRoles', 'userRoles.role', 'organization'],
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID '${createDto.userId}' not found`,
        );
      }

      // Prevent multiple pending requests for same user
      const pendingRequest = await this.userRequestRepository.findOne({
        where: {
          userId: createDto.userId,
          status: UserRequestStatus.PENDING,
        },
      });

      if (pendingRequest) {
        throw new BadRequestException(
          'This user already has a pending request. Please resolve it first.',
        );
      }
    }

    // Determine action
    let action: UserRequestAction;
    if (createDto.action) {
      action = createDto.action;
    } else if (isNewUser) {
      action = UserRequestAction.CREATE;
    } else {
      action = UserRequestAction.UPDATE;
    }

    // DELETE requires userId
    if (action === UserRequestAction.DELETE && !createDto.userId) {
      throw new BadRequestException('userId is required for DELETE action');
    }

    // CREATE validations
    if (action === UserRequestAction.CREATE) {
      if (!createDto.email) {
        throw new BadRequestException('email is required for CREATE action');
      }

      // Check if user with this email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with email "${createDto.email}" already exists`,
        );
      }

      // Check for pending CREATE request with same email
      const pendingCreateRequest = await this.userRequestRepository.findOne({
        where: {
          email: createDto.email,
          status: UserRequestStatus.PENDING,
          action: UserRequestAction.CREATE,
        },
      });

      if (pendingCreateRequest) {
        throw new BadRequestException(
          `A pending CREATE request already exists for email "${createDto.email}"`,
        );
      }
    }

    // UPDATE validations
    if (action === UserRequestAction.UPDATE && user) {
      // If email is being changed, validate uniqueness
      if (createDto.email && createDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: createDto.email },
        });

        if (existingUser) {
          throw new ConflictException(
            `User with email "${createDto.email}" already exists`,
          );
        }

        // Check for pending request with same email
        const pendingEmailRequest = await this.userRequestRepository.findOne({
          where: {
            email: createDto.email,
            status: UserRequestStatus.PENDING,
            action: UserRequestAction.CREATE,
          },
        });

        if (pendingEmailRequest) {
          throw new BadRequestException(
            `A pending CREATE request already exists for email "${createDto.email}"`,
          );
        }
      }
    }

    // Store original values for UPDATE/DELETE
    let originalEmail: string | null = null;
    let originalFirstName: string | null = null;
    let originalLastName: string | null = null;
    let originalRoleId: string | null = null;
    let originalOrganizationId: string | null = null;
    let originalIsActive: boolean | null = null;

    // Capture original values for UPDATE and DELETE actions
    if (action !== UserRequestAction.CREATE && user) {
      originalEmail = user.email;
      originalFirstName = user.firstName;
      originalLastName = user.lastName;
      // Capture original isActive value from the user
      // user.isActive is a boolean (true/false) per User entity definition
      originalIsActive = user.isActive;
      originalOrganizationId = user.organization?.id || null;

      // Get current role ID
      if (user.userRoles && user.userRoles.length > 0) {
        originalRoleId = user.userRoles[0].role.id;
      }
    }

    // Create request
    const userRequest = this.userRequestRepository.create({
      userId: createDto.userId ?? null,
      email: createDto.email ?? (user?.email || null),
      firstName: createDto.firstName ?? (user?.firstName || null),
      lastName: createDto.lastName ?? (user?.lastName || null),
      roleId: createDto.roleId ?? originalRoleId,
      organizationId: createDto.organizationId ?? originalOrganizationId,
      isActive: createDto.isActive ?? (user?.isActive ?? null),
      status: UserRequestStatus.PENDING,
      action,
      requestedBy: requestedBy ?? null,
      originalEmail,
      originalFirstName,
      originalLastName,
      originalRoleId,
      originalOrganizationId,
      // Explicitly set originalIsActive - ensure it's saved even if false
      originalIsActive: originalIsActive,
    });

    const savedRequest = await this.userRequestRepository.save(userRequest);

    return this.findOne(savedRequest.id);
  }

  /**
   * Get all user requests with pagination and search
   * Optionally filter by approval stage:
   * - firstApproval: status=PENDING, adminStatus=null (for manage_user_requests)
   * - finalApproval: status!=PENDING, adminStatus=PENDING (for final_approval_user)
   */
  async findAll(
    userId: string,
    query: QueryUserRequestsDto,
  ): Promise<{
    data: UserRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role', 'userRoles.role.rolePermissions', 'userRoles.role.rolePermissions.permission'],
    });

    if (!user) throw new NotFoundException('User not found');

    const isCEO = hasPermission(user, Permissions.FINAL_APPROVAL_USER);

    const queryBuilder = this.userRequestRepository
      .createQueryBuilder('request')
      .skip(skip)
      .take(limit)
      .orderBy('request.createdAt', 'DESC');

    // Apply permission-based filtering
    if (isCEO) {
      queryBuilder.where('request.status != :pendingStatus', {
        pendingStatus: UserRequestStatus.PENDING,
      });
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(request.email LIKE :search OR request.firstName LIKE :search OR request.lastName LIKE :search)',
        { search: searchTerm },
      );
    }

    const [requests, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    const data = await this.buildResponseDtos(requests);

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
   * Get a single user request by ID
   */
  async findOne(id: string): Promise<UserRequestResponseDto> {
    const request = await this.userRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`User request with ID '${id}' not found`);
    }

    return (await this.buildResponseDtos([request]))[0];
  }

  /**
   * Review (approve/reject) a user request
   * Supports two-stage approval:
   * 1. First approval (manage_user_requests): status=PENDING -> status=APPROVED, adminStatus=PENDING
   * 2. Final approval (final_approval_user): status=APPROVED, adminStatus=PENDING -> adminStatus=APPROVED (and apply changes)
   */
  async review(
    id: string,
    reviewDto: ReviewUserRequestDto,
    reviewedBy: string,
    hasFinalApprovalPermission: boolean = false,
  ): Promise<UserRequestResponseDto> {
    const request = await this.userRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`User request with ID '${id}' not found`);
    }

    if (hasFinalApprovalPermission && request.adminStatus == null) {
      throw new BadRequestException(
        'This request has not been reviewed yet.',
      );
    }

    // Handle first approval
    if (!hasFinalApprovalPermission) {
      // Handle first approval
      request.status = reviewDto.status;
      request.adminStatus = SuperAdminRequestStatus.PENDING;
      request.reviewedBy = reviewedBy;
      request.reviewedAt = new Date();
      request.reviewNotes = reviewDto.reviewNotes || null;
      await this.userRequestRepository.save(request);
    } else {
      // Handle final approval
      request.adminStatus = reviewDto.status === UserRequestStatus.APPROVED ?
        SuperAdminRequestStatus.APPROVED : SuperAdminRequestStatus.REJECTED;
      request.reviewedBy = reviewedBy;
      request.reviewedAt = new Date();
      request.reviewNotes = reviewDto.reviewNotes || null;
      if (reviewDto.status === UserRequestStatus.APPROVED) {
        await this.applyApprovedRequest(request);
      }
      await this.userRequestRepository.save(request);
    }
    return this.findOne(id);
  }

  /**
   * Apply approved request to the actual user
   * Creates a new user, updates existing user, or soft deletes user based on action
   */
  private async applyApprovedRequest(request: UserRequest): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // Handle DELETE action
      if (request.action === UserRequestAction.DELETE) {
        if (!request.userId) {
          throw new BadRequestException('Cannot delete user: userId is missing');
        }

        const userToDelete = await manager.findOne(User, {
          where: { id: request.userId },
        });

        if (!userToDelete) {
          throw new NotFoundException(`User with ID '${request.userId}' not found`);
        }

        // Soft delete: set isActive to false
        userToDelete.isActive = false;
        await manager.save(userToDelete);
        this.logger.log(`Soft deleted user: ${request.userId}`);
        return;
      }

      // Handle CREATE action
      if (request.action === UserRequestAction.CREATE) {
        if (!request.email) {
          throw new BadRequestException('Cannot create user: email is missing');
        }

        // Ensure no user already exists with the same email
        const existingUser = await manager.findOne(User, {
          where: { email: request.email },
        });

        if (existingUser) {
          throw new ConflictException(
            `User with email "${request.email}" already exists. Request will remain in PENDING status.`,
          );
        }

        // Generate temporary password (user will need to reset)
        const saltRounds = 10;
        // TODO: Uncomment this when we have a notifications API
        // const temporaryPassword = `Temp${Date.now()}${Math.random().toString(36).slice(2)}`;
        const temporaryPassword = 'Password@123';
        const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

        // Create new user from request data
        const newUser = manager.create(User, {
          email: request.email,
          password: hashedPassword,
          firstName: request.firstName || '',
          lastName: request.lastName || '',
          isActive: request.isActive ?? true,
          organization: request.organizationId
            ? { id: request.organizationId }
            : undefined,
        });

        const savedUser = await manager.save(newUser);

        // Assign role if provided (using transaction manager)
        if (request.roleId) {
          const userRoleRepository = manager.getRepository(UserRole);
          // Remove any existing roles first
          await userRoleRepository.delete({ userId: savedUser.id });
          // Create new user-role association
          const userRole = userRoleRepository.create({
            userId: savedUser.id,
            roleId: request.roleId,
          });
          await userRoleRepository.save(userRole);
        }

        this.logger.log(
          `Created new user: ${savedUser.id} (${savedUser.email}) with temporary password`,
        );
        return;
      }

      // Handle UPDATE action
      if (request.action === UserRequestAction.UPDATE) {
        if (!request.userId) {
          throw new BadRequestException('Cannot update user: userId is missing');
        }

        const existingUser = await manager.findOne(User, {
          where: { id: request.userId },
          relations: ['userRoles', 'userRoles.role', 'organization'],
        });

        if (!existingUser) {
          throw new NotFoundException(`User with ID '${request.userId}' not found`);
        }

        // If email is being changed, check for conflicts
        if (request.email && request.email !== existingUser.email) {
          const userWithNewEmail = await manager.findOne(User, {
            where: { email: request.email },
          });

          if (userWithNewEmail) {
            throw new ConflictException(
              `User with email "${request.email}" already exists. Request will remain in PENDING status.`,
            );
          }
        }

        // Apply proposed changes
        if (request.email !== undefined && request.email !== null) {
          existingUser.email = request.email;
        }
        if (request.firstName !== undefined && request.firstName !== null) {
          existingUser.firstName = request.firstName;
        }
        if (request.lastName !== undefined && request.lastName !== null) {
          existingUser.lastName = request.lastName;
        }
        if (request.isActive !== undefined && request.isActive !== null) {
          existingUser.isActive = request.isActive;
        }
        if (request.organizationId !== undefined) {
          existingUser.organization = request.organizationId
            ? ({ id: request.organizationId } as any)
            : undefined;
        }

        await manager.save(existingUser);

        // Update role if changed
        if (request.roleId !== undefined) {
          const currentRoleId =
            existingUser.userRoles && existingUser.userRoles.length > 0
              ? existingUser.userRoles[0].role.id
              : null;

          if (request.roleId !== currentRoleId) {
            const userRoleRepository = manager.getRepository(UserRole);
            if (request.roleId) {
              // Remove existing roles first
              await userRoleRepository.delete({ userId: existingUser.id });
              // Create new user-role association
              const userRole = userRoleRepository.create({
                userId: existingUser.id,
                roleId: request.roleId,
              });
              await userRoleRepository.save(userRole);
            } else {
              // Remove all roles
              await userRoleRepository.delete({
                userId: existingUser.id,
              });
            }
          }
        }

        this.logger.log(`Updated user: ${existingUser.id}`);
        return;
      }
    });
  }

  /**
   * Delete a user request
   */
  async remove(id: string): Promise<{ message: string }> {
    const request = await this.userRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`User request with ID '${id}' not found`);
    }

    // Only allow deleting PENDING requests
    if (request.status !== UserRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot delete ${request.status} request. Only pending requests can be deleted.`,
      );
    }

    await this.userRequestRepository.remove(request);

    return { message: `User request with ID '${id}' has been deleted successfully` };
  }

  /**
   * Build response DTOs with role and organization names
   */
  private async buildResponseDtos(
    requests: UserRequest[],
  ): Promise<UserRequestResponseDto[]> {
    // Collect unique role IDs
    const roleIds = Array.from(
      new Set(
        requests
          .flatMap((req) => [req.roleId, req.originalRoleId])
          .filter((id): id is string => !!id),
      ),
    );

    // Collect unique organization IDs
    const organizationIds = Array.from(
      new Set(
        requests
          .flatMap((req) => [req.organizationId, req.originalOrganizationId])
          .filter((id): id is string => !!id),
      ),
    );

    // Fetch roles and organizations
    const roleMap = new Map<string, Role>();
    if (roleIds.length > 0) {
      const roles = await this.roleRepository.find({
        where: { id: In(roleIds) },
      });
      roles.forEach((role) => roleMap.set(role.id, role));
    }

    const organizationMap = new Map<string, Organization>();
    if (organizationIds.length > 0) {
      const organizations = await this.organizationRepository.find({
        where: { id: In(organizationIds) },
      });
      organizations.forEach((org) => organizationMap.set(org.id, org));
    }

    return requests.map((request) => {
      const role = request.roleId ? roleMap.get(request.roleId) : undefined;
      const originalRole = request.originalRoleId
        ? roleMap.get(request.originalRoleId)
        : undefined;
      const organization = request.organizationId
        ? organizationMap.get(request.organizationId)
        : undefined;
      const originalOrganization = request.originalOrganizationId
        ? organizationMap.get(request.originalOrganizationId)
        : undefined;

      return plainToInstance(
        UserRequestResponseDto,
        {
          ...request,
          roleName: role?.name || null,
          originalRoleName: originalRole?.name || null,
          organizationName: organization?.name || null,
          originalOrganizationName: originalOrganization?.name || null,
        },
        { excludeExtraneousValues: true },
      );
    });
  }
}
