import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionsToRoleDto } from '../dto/assign-permissions-to-role.dto';
import { RBACService } from './rbac.service';
import { RoleResponseDto } from '../dto/role-response.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private rbacService: RBACService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    // Check if role with same name already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = this.roleRepository.create(createRoleDto);
    const savedRole = await this.roleRepository.save(role);

    return this.mapToResponseDto(savedRole);
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

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({ where: { id } });

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

    Object.assign(role, updateRoleDto);
    const updatedRole = await this.roleRepository.save(role);

    return this.findOne(updatedRole.id);
  }

  async remove(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.roleRepository.remove(role);
  }

  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsToRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.rbacService.assignPermissionsToRole(id, assignPermissionsDto.permissionIds);

    return this.findOne(id);
  }

  async removePermission(id: string, permissionId: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.rbacService.removePermissionFromRole(id, permissionId);

    return this.findOne(id);
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

