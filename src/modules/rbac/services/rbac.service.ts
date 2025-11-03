import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class RBACService {
  constructor(
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Get all permissions for a user (through their roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });

    const permissionIds = new Set<string>();
    for (const userRole of userRoles) {
      if (userRole.role?.rolePermissions) {
        for (const rolePermission of userRole.role.rolePermissions) {
          if (rolePermission.permission) {
            permissionIds.add(rolePermission.permission.id);
          }
        }
      }
    }

    if (permissionIds.size === 0) {
      return [];
    }

    return this.permissionRepository.find({
      where: { id: In(Array.from(permissionIds)) },
    });
  }

  /**
   * Get all permission names for a user
   */
  async getUserPermissionNames(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.map((p) => p.name);
  }

  /**
   * Check if user has a specific permission
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissionNames = await this.getUserPermissionNames(userId);
    return permissionNames.includes(permissionName);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
    const userPermissionNames = await this.getUserPermissionNames(userId);
    return permissionNames.some((name) => userPermissionNames.includes(name));
  }

  /**
   * Check if user has all of the specified permissions
   */
  async userHasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
    const userPermissionNames = await this.getUserPermissionNames(userId);
    return permissionNames.every((name) => userPermissionNames.includes(name));
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles.map((ur) => ur.role).filter((r) => r !== null);
  }

  /**
   * Assign roles to a user (replaces existing roles)
   */
  async assignRolesToUser(userId: string, roleIds: string[]): Promise<UserRole[]> {
    // Remove existing roles
    await this.userRoleRepository.delete({ userId });

    // Create new user-role associations
    const userRoles = roleIds.map((roleId) =>
      this.userRoleRepository.create({
        userId,
        roleId,
      }),
    );

    return this.userRoleRepository.save(userRoles);
  }

  /**
   * Add roles to a user (adds to existing roles)
   */
  async addRolesToUser(userId: string, roleIds: string[]): Promise<UserRole[]> {
    // Get existing role IDs for this user
    const existingUserRoles = await this.userRoleRepository.find({
      where: { userId },
    });
    const existingRoleIds = existingUserRoles.map((ur) => ur.roleId);

    // Filter out role IDs that are already assigned
    const newRoleIds = roleIds.filter((roleId) => !existingRoleIds.includes(roleId));

    if (newRoleIds.length === 0) {
      return existingUserRoles;
    }

    // Create new user-role associations for new roles
    const newUserRoles = newRoleIds.map((roleId) =>
      this.userRoleRepository.create({
        userId,
        roleId,
      }),
    );

    const savedNewRoles = await this.userRoleRepository.save(newUserRoles);
    return [...existingUserRoles, ...savedNewRoles];
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.delete({ userId, roleId });
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<RolePermission[]> {
    // Remove existing permissions for this role
    await this.rolePermissionRepository.delete({ roleId });

    // Create new role-permission associations
    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      }),
    );

    return this.rolePermissionRepository.save(rolePermissions);
  }

  /**
   * Add permissions to a role (adds to existing permissions)
   */
  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<RolePermission[]> {
    // Get existing permission IDs for this role
    const existingRolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
    });
    const existingPermissionIds = existingRolePermissions.map((rp) => rp.permissionId);

    // Filter out permission IDs that are already assigned
    const newPermissionIds = permissionIds.filter((permissionId) => !existingPermissionIds.includes(permissionId));

    if (newPermissionIds.length === 0) {
      return existingRolePermissions;
    }

    // Create new role-permission associations for new permissions
    const newRolePermissions = newPermissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      }),
    );

    const savedNewPermissions = await this.rolePermissionRepository.save(newRolePermissions);
    return [...existingRolePermissions, ...savedNewPermissions];
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.delete({ roleId, permissionId });
  }
}

