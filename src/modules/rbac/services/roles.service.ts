import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionsToRoleDto } from '../dto/assign-permissions-to-role.dto';
import { RBACService } from './rbac.service';
import { RoleResponseDto } from '../dto/role-response.dto';
import { RoleRequestsService } from './role-requests.service';
import { CreateRoleRequestDto, CreateRolePermissionRequestDto } from '../dto/create-role-request.dto';
import { RoleRequestResponseDto } from '../dto/role-request-response.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private rbacService: RBACService,
    private roleRequestsService: RoleRequestsService,
  ) {}

  async create(createRoleDto: CreateRoleDto, requestedBy?: string): Promise<RoleRequestResponseDto> {
    // Check if role with same name already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Create a role request instead of directly creating the role
    // For new roles, we don't have permissions yet, so pass empty array
    const createRoleRequestDto: CreateRoleRequestDto = {
      roleId: undefined, // null for new role creation
      name: createRoleDto.name,
      description: createRoleDto.description,
      permissions: [], // Permissions will be added via assignPermissions endpoint
    };

    return this.roleRequestsService.create(createRoleRequestDto, requestedBy);
  }

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { createdAt: 'ASC' },
    });

    return roles.map((role) => this.mapToResponseDto(role));
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.mapToResponseDto(role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, requestedBy?: string): Promise<RoleRequestResponseDto> {
    const role = await this.roleRepository.findOne({ 
      where: { id },
      relations: ['rolePermissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if name is being updated and if it conflicts with existing role
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    // Get current permissions for the role
    const currentPermissions = role.rolePermissions?.map(rp => ({
      permissionId: rp.permissionId,
      action: 'unchanged' as const,
      originalRolePermissionId: rp.id,
    })) || [];

    // Create a role request instead of directly updating the role
    const createRoleRequestDto: CreateRoleRequestDto = {
      roleId: id,
      name: updateRoleDto.name || role.name,
      description: updateRoleDto.description !== undefined ? updateRoleDto.description : role.description,
      permissions: currentPermissions,
    };

    return this.roleRequestsService.create(createRoleRequestDto, requestedBy);
  }

  async remove(id: string, requestedBy?: string): Promise<RoleRequestResponseDto> {
    const role = await this.roleRepository.findOne({ 
      where: { id },
      relations: ['rolePermissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Get current permissions for the role (all will be deleted)
    const currentPermissions = role.rolePermissions?.map(rp => ({
      permissionId: rp.permissionId,
      action: 'delete' as const,
      originalRolePermissionId: rp.id,
    })) || [];

    // Create a role request with delete action instead of directly deleting the role
    const createRoleRequestDto: CreateRoleRequestDto = {
      roleId: id,
      name: role.name,
      description: role.description,
      action: 'delete',
      permissions: currentPermissions,
    };

    return this.roleRequestsService.create(createRoleRequestDto, requestedBy);
  }

  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsToRoleDto, requestedBy?: string): Promise<RoleRequestResponseDto> {
    const role = await this.roleRepository.findOne({ 
      where: { id },
      relations: ['rolePermissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Get current permissions
    const currentPermissionIds = new Set(role.rolePermissions?.map(rp => rp.permissionId) || []);
    const requestedPermissionIds = new Set(assignPermissionsDto.permissionIds);

    // Build permission requests: mark as create/delete/unchanged
    const permissionRequests: CreateRolePermissionRequestDto[] = assignPermissionsDto.permissionIds.map(permissionId => ({
      permissionId,
      action: currentPermissionIds.has(permissionId) ? 'unchanged' as const : 'create' as const,
      originalRolePermissionId: role.rolePermissions?.find(rp => rp.permissionId === permissionId)?.id,
    }));

    // Add permissions that are being removed (in current but not in requested)
    for (const currentPermissionId of currentPermissionIds) {
      if (!requestedPermissionIds.has(currentPermissionId)) {
        const rolePermission = role.rolePermissions?.find(rp => rp.permissionId === currentPermissionId);
        permissionRequests.push({
          permissionId: currentPermissionId,
          action: 'delete' as const,
          originalRolePermissionId: rolePermission?.id,
        });
      }
    }

    // Create a role request instead of directly assigning permissions
    const createRoleRequestDto: CreateRoleRequestDto = {
      roleId: id,
      name: role.name,
      description: role.description,
      permissions: permissionRequests,
    };

    return this.roleRequestsService.create(createRoleRequestDto, requestedBy);
  }

  async removePermission(id: string, permissionId: string, requestedBy?: string): Promise<RoleRequestResponseDto> {
    const role = await this.roleRepository.findOne({ 
      where: { id },
      relations: ['rolePermissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Get current permissions (excluding the one to be removed)
    const permissionRequests: CreateRolePermissionRequestDto[] = role.rolePermissions
      ?.filter(rp => rp.permissionId !== permissionId)
      .map(rp => ({
        permissionId: rp.permissionId,
        action: 'unchanged' as const,
        originalRolePermissionId: rp.id,
      })) || [];

    // Add the permission to be removed
    const rolePermissionToRemove = role.rolePermissions?.find(rp => rp.permissionId === permissionId);
    if (rolePermissionToRemove) {
      permissionRequests.push({
        permissionId,
        action: 'delete' as const,
        originalRolePermissionId: rolePermissionToRemove.id,
      });
    }

    // Create a role request instead of directly removing permission
    const createRoleRequestDto: CreateRoleRequestDto = {
      roleId: id,
      name: role.name,
      description: role.description,
      permissions: permissionRequests,
    };

    return this.roleRequestsService.create(createRoleRequestDto, requestedBy);
  }

  private mapToResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions?.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

