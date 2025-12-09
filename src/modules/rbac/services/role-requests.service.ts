import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { RoleRequest, RoleRequestStatus } from '../entities/role-request.entity';
import { RolePermissionRequest, RolePermissionAction } from '../entities/role-permission-request.entity';
import { CreateRoleRequestDto } from '../dto/create-role-request.dto';
import { ReviewRoleRequestDto } from '../dto/review-role-request.dto';
import { RoleRequestResponseDto, RolePermissionRequestResponseDto } from '../dto/role-request-response.dto';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class RoleRequestsService {
  constructor(
    @InjectRepository(RoleRequest)
    private readonly roleRequestRepository: Repository<RoleRequest>,
    @InjectRepository(RolePermissionRequest)
    private readonly rolePermissionRequestRepository: Repository<RolePermissionRequest>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a role request for approval
   */
  async create(
    createRoleRequestDto: CreateRoleRequestDto,
    requestedBy?: string,
  ): Promise<RoleRequestResponseDto> {
    const isNewRole = !createRoleRequestDto.roleId;
    let role: Role | null = null;
    let currentVersion = 'v1';
    let currentRolePermissions: RolePermission[] = [];
    let currentPermissionsMap = new Map<string, RolePermission>();

    // If updating existing role, verify it exists and get current state
    if (!isNewRole && createRoleRequestDto.roleId) {
      role = await this.roleRepository.findOne({
        where: { id: createRoleRequestDto.roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID '${createRoleRequestDto.roleId}' not found`);
      }

      // Get current version of the role to determine next version
      currentVersion = role.version || 'v1';
      const versionNumber = parseInt(currentVersion.replace('v', '')) || 1;
      currentVersion = `v${versionNumber + 1}`;

      // Get all current permissions for the role
      currentRolePermissions = await this.rolePermissionRepository.find({
        where: { roleId: createRoleRequestDto.roleId },
        relations: ['permission'],
      });

      // Create a map of current permissions by permissionId for quick lookup
      currentPermissionsMap = new Map(
        currentRolePermissions.map((rp) => [rp.permissionId, rp])
      );
    } else {
      // For new roles, start with v1
      currentVersion = 'v1';
    }

    // Create role request
    const roleRequest = this.roleRequestRepository.create({
      roleId: createRoleRequestDto.roleId || null,
      name: createRoleRequestDto.name,
      description: createRoleRequestDto.description,
      status: RoleRequestStatus.PENDING,
      version: currentVersion,
      requestedBy,
    });

    const savedRoleRequest = await this.roleRequestRepository.save(roleRequest);

    // Create permission requests - include ALL permissions (changed and unchanged)
    const permissionRequests: RolePermissionRequest[] = [];

    // Process permissions from request - compare with current permissions to determine actions
    for (const permissionDto of createRoleRequestDto.permissions) {
      // Verify permission exists
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionDto.permissionId },
      });

      if (!permission) {
        throw new NotFoundException(`Permission with ID '${permissionDto.permissionId}' not found`);
      }

      const currentRolePermission = currentPermissionsMap.get(permissionDto.permissionId);
      const incomingAction = (permissionDto.action as RolePermissionAction) || RolePermissionAction.UNCHANGED;

      // Determine the actual action by comparing with current role permission
      let actualAction: RolePermissionAction;

      // Handle DELETE action - don't change it
      if (incomingAction === RolePermissionAction.DELETE) {
        if (!currentRolePermission) {
          // Can't delete what doesn't exist
          continue; // Skip this permission
        }
        actualAction = RolePermissionAction.DELETE;
      }
      // If permission doesn't exist in current role, it must be CREATE
      else if (!currentRolePermission) {
        actualAction = RolePermissionAction.CREATE;
      }
      // If permission exists in current role
      else {
        // If incoming action is CREATE, but permission exists, it's actually unchanged
        if (incomingAction === RolePermissionAction.CREATE) {
          actualAction = RolePermissionAction.UNCHANGED;
        } else {
          // Permission exists and no change requested, mark as unchanged
          actualAction = RolePermissionAction.UNCHANGED;
        }
      }

      permissionRequests.push(
        this.rolePermissionRequestRepository.create({
          roleRequestId: savedRoleRequest.id,
          permissionId: permissionDto.permissionId,
          originalRolePermissionId: permissionDto.originalRolePermissionId || currentRolePermission?.id || null,
          action: actualAction,
          version: currentVersion,
        })
      );
    }

    // Clone unchanged permissions from current role that are NOT in the request
    for (const currentRolePermission of currentRolePermissions) {
      // Skip if this permission was in the request (already processed above)
      const permissionInRequest = createRoleRequestDto.permissions.find(
        (p) => p.permissionId === currentRolePermission.permissionId
      );
      if (permissionInRequest) {
        continue;
      }

      // Clone unchanged permission with version marker
      permissionRequests.push(
        this.rolePermissionRequestRepository.create({
          roleRequestId: savedRoleRequest.id,
          permissionId: currentRolePermission.permissionId,
          originalRolePermissionId: currentRolePermission.id,
          action: RolePermissionAction.UNCHANGED,
          version: currentVersion,
        })
      );
    }

    await this.rolePermissionRequestRepository.save(permissionRequests);

    // Return with permissions
    return this.findOne(savedRoleRequest.id);
  }

  /**
   * Get all role requests
   */
  async findAll(): Promise<RoleRequestResponseDto[]> {
    const requests = await this.roleRequestRepository.find({
      relations: ['permissionRequests'],
      order: { createdAt: 'DESC' },
    });

    return this.buildResponseDtos(requests);
  }

  /**
   * Get a single role request by ID
   */
  async findOne(id: string): Promise<RoleRequestResponseDto> {
    const request = await this.roleRequestRepository.findOne({
      where: { id },
      relations: ['permissionRequests'],
    });

    if (!request) {
      throw new NotFoundException(`Role request with ID '${id}' not found`);
    }

    return (await this.buildResponseDtos([request]))[0];
  }

  /**
   * Review (approve/reject) a role request
   */
  async review(
    id: string,
    reviewDto: ReviewRoleRequestDto,
    reviewedBy: string,
  ): Promise<RoleRequestResponseDto> {
    const request = await this.roleRequestRepository.findOne({
      where: { id },
      relations: ['permissionRequests'],
    });

    if (!request) {
      throw new NotFoundException(`Role request with ID '${id}' not found`);
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new BadRequestException(
        `Role request is already ${request.status}. Only pending requests can be reviewed.`,
      );
    }

    // Update request status
    request.status = reviewDto.status;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewDto.reviewNotes || null;

    await this.roleRequestRepository.save(request);

    // If approved, apply the changes to the actual role
    if (reviewDto.status === RoleRequestStatus.APPROVED) {
      await this.applyApprovedRequest(request, reviewDto.permissionDecisions);
    }

    return this.findOne(id);
  }

  /**
   * Apply approved request to the actual role
   * Creates a new version of the role with the approved changes (or creates new role if roleId is null)
   * Only applies permissions that are individually approved (or all if no decisions provided)
   */
  private async applyApprovedRequest(
    request: RoleRequest,
    permissionDecisions?: Record<string, 'approved' | 'rejected'>,
  ): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const isNewRole = !request.roleId;
      let originalRole: Role | null = null;
      let savedNewRole: Role;

      if (isNewRole) {
        // Create new role (no existing role to update)
        const newRole = manager.create(Role, {
          name: request.name,
          description: request.description,
          version: 'v1',
        });
        savedNewRole = await manager.save(newRole);
      } else {
        // Get the original role
        originalRole = await manager.findOne(Role, {
          where: { id: request.roleId! },
        });

        if (!originalRole) {
          throw new NotFoundException(`Role with ID '${request.roleId}' not found`);
        }

        // Create new version (versioning logic)
        const currentVersion = originalRole.version || 'v1';
        const versionNumber = parseInt(currentVersion.replace('v', '')) || 1;
        const nextVersion = `v${versionNumber + 1}`;

        // Deactivate old role by renaming it
        const oldName = originalRole.name;
        originalRole.name = `${oldName}-${currentVersion}`;
        await manager.save(originalRole);

        // Create new role version
        const newRole = manager.create(Role, {
          name: request.name,
          description: request.description,
          version: nextVersion,
        });

        savedNewRole = await manager.save(newRole);

      } // end isNewRole check

      // Get original role permissions to build ID mapping (only if updating existing role)
      let originalRolePermissions: RolePermission[] = [];
      if (!isNewRole && originalRole) {
        originalRolePermissions = await manager.find(RolePermission, {
          where: { roleId: originalRole.id },
        });
      }

      // Build mapping: originalRolePermissionId -> permissionId
      const originalIdToPermissionId = new Map<string, string>();
      originalRolePermissions.forEach((rp) => {
        originalIdToPermissionId.set(rp.id, rp.permissionId);
      });

      // Process permission requests - all permissions (changed and unchanged) are already in the request
      // Filter based on individual permission decisions if provided
      const permissionsToCreate: RolePermission[] = [];

      // First pass: collect approved permissions
      for (const permissionRequest of request.permissionRequests) {
        if (permissionRequest.action === RolePermissionAction.DELETE) {
          // Skip deleted permissions - they won't be copied to new role
          continue;
        }

        // If permission decisions are provided, filter based on decisions
        if (permissionDecisions !== undefined) {
          // Check if any decisions were actually made
          const hasAnyDecisions = Object.keys(permissionDecisions).length > 0;

          if (hasAnyDecisions) {
            // Individual decisions were made - filter based on them
            const decision = permissionDecisions[permissionRequest.permissionId];

            // If permission is explicitly rejected, skip it
            if (decision === 'rejected') {
              continue;
            }

            // For unchanged permissions: approved by default (apply unless explicitly rejected)
            if (permissionRequest.action === RolePermissionAction.UNCHANGED) {
              // Unchanged permissions are approved by default - only skip if explicitly rejected
              // (already handled above, so continue to apply)
            } else {
              // For changed permissions (create/delete): require explicit approval
              // Only apply if decision is explicitly 'approved'
              if (decision !== 'approved') {
                continue;
              }
            }
          }
          // If permissionDecisions is empty object (no decisions made), apply all permissions
        }
        // If permissionDecisions is undefined, apply all permissions (backward compatibility)

        // Create role permission from request
        const newRolePermission = manager.create(RolePermission, {
          roleId: savedNewRole.id,
          permissionId: permissionRequest.permissionId,
        });
        permissionsToCreate.push(newRolePermission);
      }

      // Save all permissions
      if (permissionsToCreate.length > 0) {
        await manager.save(permissionsToCreate);
      }

      // Migrate user-role assignments from old role to new role (only if updating existing role)
      // This ensures users get the new role version
      if (!isNewRole && originalRole) {
        await manager.query(
          `UPDATE user_roles SET "roleId" = $1 WHERE "roleId" = $2`,
          [savedNewRole.id, originalRole.id]
        );
      }
    });
  }

  /**
   * Delete a role request
   */
  async remove(id: string): Promise<{ message: string }> {
    const request = await this.roleRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Role request with ID '${id}' not found`);
    }

    await this.roleRequestRepository.remove(request);

    return { message: `Role request with ID '${id}' has been deleted successfully` };
  }

  /**
   * Build response DTOs with permission names attached
   */
  private async buildResponseDtos(requests: RoleRequest[]): Promise<RoleRequestResponseDto[]> {
    // Collect unique permission IDs across all requests
    const permissionIds = Array.from(
      new Set(
        requests.flatMap((req) => req.permissionRequests?.map((pr) => pr.permissionId) || []),
      ),
    );

    const permissionMap = new Map<string, Permission>();
    if (permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      permissions.forEach((perm) => permissionMap.set(perm.id, perm));
    }

    return requests.map((request) => {
      const permissions = request.permissionRequests.map((permReq) =>
        plainToInstance(
          RolePermissionRequestResponseDto,
          {
            ...permReq,
            permissionName: permissionMap.get(permReq.permissionId)?.name,
          },
          { excludeExtraneousValues: true },
        ),
      );

      return plainToInstance(
        RoleRequestResponseDto,
        {
          ...request,
          permissions,
        },
        { excludeExtraneousValues: true },
      );
    });
  }
}

