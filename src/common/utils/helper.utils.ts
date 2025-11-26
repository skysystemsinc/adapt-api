import { RolePermission } from "src/modules/rbac/entities/role-permission.entity";
import { User } from "src/modules/users/entities/user.entity";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function hasPermission(user: User, permission: string): boolean {
  return user.userRoles[0].role.rolePermissions.some((rolePermission: RolePermission) => rolePermission.permission.name === permission);
}