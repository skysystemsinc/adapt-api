import { DataSource } from 'typeorm';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';
import { RolePermission } from '../../modules/rbac/entities/role-permission.entity';
import { Permissions } from '../../modules/rbac/constants/permissions.constants';

export class RBACSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);
    const rolePermissionRepository = dataSource.getRepository(RolePermission);

    console.log('🌱 Seeding RBAC data...\n');

    // Create all permissions from the enum
    const permissionNames = Object.values(Permissions);
    const createdPermissions: Permission[] = [];

    for (const permissionName of permissionNames) {
      const exists = await permissionRepository.findOne({
        where: { name: permissionName },
      });

      if (!exists) {
        const permission = permissionRepository.create({
          name: permissionName,
          description: `Permission to ${permissionName.replace(/_/g, ' ').toLowerCase()}`,
        });
        const savedPermission = await permissionRepository.save(permission);
        createdPermissions.push(savedPermission);
        console.log(`✓ Created permission: ${permissionName}`);
      } else {
        createdPermissions.push(exists);
        console.log(`- Permission already exists: ${permissionName}`);
      }
    }

    // Create roles
    const roles = [
      {
        name: 'Applicant',
        description: 'User who submits registration applications',
      },
      {
        name: 'Super Admin',
        description: 'Administrator with full system access',
      },
      {
        name: 'Scrutiny Officer',
        description: 'Officer who reviews and verifies applications',
      },
      {
        name: 'Finance Expert',
        description: 'Finance expert who reviews financial aspects',
      },
    ];

    const createdRoles: Role[] = [];

    for (const roleData of roles) {
      const exists = await roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!exists) {
        const role = roleRepository.create(roleData);
        const savedRole = await roleRepository.save(role);
        createdRoles.push(savedRole);
        console.log(`✓ Created role: ${roleData.name}`);
      } else {
        createdRoles.push(exists);
        console.log(`- Role already exists: ${roleData.name}`);
      }
    }

    // Assign permissions to roles
    const superAdminRole = createdRoles.find((r) => r.name === 'Super Admin');
    if (superAdminRole) {
      // Super Admin gets all permissions
      for (const permission of createdPermissions) {
        const exists = await rolePermissionRepository.findOne({
          where: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });

        if (!exists) {
          const rolePermission = rolePermissionRepository.create({
            roleId: superAdminRole.id,
            permissionId: permission.id,
          });
          await rolePermissionRepository.save(rolePermission);
          console.log(`✓ Assigned permission ${permission.name} to Super Admin`);
        }
      }
    }

    const applicantRole = createdRoles.find((r) => r.name === 'Applicant');
    if (applicantRole) {
      // Applicant gets basic permissions
      const applicantPermissions = [
        Permissions.SUBMIT_REGISTRATION,
        Permissions.VIEW_APPLICATION,
        Permissions.UPDATE_APPLICATION,
      ];

      for (const permissionName of applicantPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: applicantRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: applicantRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Applicant`);
          }
        }
      }
    }

    const scrutinyOfficerRole = createdRoles.find((r) => r.name === 'Scrutiny Officer');
    if (scrutinyOfficerRole) {
      // Scrutiny Officer gets review and verification permissions
      const scrutinyPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.REVIEW_KYC,
        Permissions.VERIFY_KYC,
        Permissions.UPDATE_APPLICATION_STATUS,
      ];

      for (const permissionName of scrutinyPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: scrutinyOfficerRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: scrutinyOfficerRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Scrutiny Officer`);
          }
        }
      }
    }

    const financeExpertRole = createdRoles.find((r) => r.name === 'Finance Expert');
    if (financeExpertRole) {
      // Finance Expert gets finance-related permissions
      const financePermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
      ];

      for (const permissionName of financePermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: financeExpertRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: financeExpertRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Finance Expert`);
          }
        }
      }
    }

    console.log('\n✅ RBAC seeding completed!');
  }
}

