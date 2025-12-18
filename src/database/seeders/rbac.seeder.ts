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
      { name: 'HOD', description: 'Head of Department who reviews and verifies applications' },
      { name: 'HOD - Finance', description: 'Head of Department who reviews and verifies financial applications' },
      { name: 'HOD - Legal', description: 'Head of Department who reviews and verifies legal applications' },
      { name: 'HOD - HR', description: 'Head of Department who reviews and verifies HR applications' },
      { name: 'HOD - Inspection', description: 'Head of Department who reviews and verifies inspection applications' },
      { name: 'HOD - Security', description: 'Head of Department who reviews and verifies security applications' },
      { name: 'HOD - Technical', description: 'Head of Department who reviews and verifies technical applications' },
      { name: 'HOD - ESG', description: 'Head of Department who reviews and verifies ESG applications' },
      { name: 'Expert Maker - Finance', description: 'Expert who reviews and verifies financial applications' },
      { name: 'Expert Checker - Finance', description: 'Expert who reviews and verifies financial applications' },
      { name: 'Expert Maker - Legal', description: 'Expert who reviews and verifies legal applications' },
      { name: 'Expert Checker - Legal', description: 'Expert who reviews and verifies legal applications' },
      { name: 'Expert Maker - HR', description: 'Expert who reviews and verifies HR applications' },
      { name: 'Expert Checker - HR', description: 'Expert who reviews and verifies HR applications' },
      { name: 'Expert Maker - Inspection', description: 'Expert who reviews and verifies inspection applications' },
      { name: 'Expert Checker - Inspection', description: 'Expert who reviews and verifies inspection applications' },
      { name: 'Expert Maker - Security', description: 'Expert who reviews and verifies security applications' },
      { name: 'Expert Checker - Security', description: 'Expert who reviews and verifies security applications' },
      { name: 'Expert Maker - Technical', description: 'Expert who reviews and verifies technical applications' },
      { name: 'Expert Checker - Technical', description: 'Expert who reviews and verifies technical applications' },
      { name: 'Expert Maker - ESG', description: 'Expert who reviews and verifies ESG applications' },
      { name: 'Expert Checker - ESG', description: 'Expert who reviews and verifies ESG applications' },
      { name: 'HOD - Final Review', description: 'Head of Department who reviews and verifies final applications' },
      { name: 'CEO/Committee', description: 'CEO or Committee who reviews and verifies applications' },
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

      const excludedPermissions = [
        Permissions.IS_HOD,
        Permissions.IS_EXPERT,
      ];

      const permissionsForSuperAdmin = createdPermissions.filter(
        (permission) => !excludedPermissions.includes(permission.name as Permissions)
      );

      for (const permission of permissionsForSuperAdmin) {
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
        Permissions.VIEW_KYC,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.MANAGE_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_OFFICER,
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

    const financeExpertRole = createdRoles.find((r) => r.name === 'Expert Maker - Finance');
    if (financeExpertRole) {
      // Finance Expert gets finance-related permissions
      const financePermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_FINANCE,
        Permissions.IS_EXPERT,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
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

    const hrExpertRole = createdRoles.find((r) => r.name === 'Expert Maker - HR');
    if (hrExpertRole) {
      // Finance Expert gets finance-related permissions
      const hrPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HR,
        Permissions.IS_EXPERT,
        Permissions.IS_HR_EXPERT,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
      ];

      for (const permissionName of hrPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: hrExpertRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: hrExpertRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to HR Expert`);
          }
        }
      }
    }

    const legalExpertRole = createdRoles.find((r) => r.name === 'Expert Maker - Legal');
    if (legalExpertRole) {
      // Finance Expert gets finance-related permissions
      const hrPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_LEGAL,
        Permissions.IS_EXPERT,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
      ];

      for (const permissionName of hrPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: legalExpertRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: legalExpertRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to HR Expert`);
          }
        }
      }


    }

    const technicalExpertRole = createdRoles.find((r) => r.name === 'Expert Maker - Technical');
    if (technicalExpertRole) {
      // Finance Expert gets finance-related permissions
      const technicalPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_TECHNICAL,
        Permissions.IS_EXPERT,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
      ];

      for (const permissionName of technicalPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: technicalExpertRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: technicalExpertRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Technical Expert`);
          }
        }
      }
    }


    const esgExpertMakerRole = createdRoles.find((r) => r.name === 'Expert Maker - ESG');
    if (esgExpertMakerRole) {
      // ESG Expert gets ESG-related permissions
      const esgPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_ESG,
        Permissions.IS_EXPERT,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
      ];
      for (const permissionName of esgPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: esgExpertMakerRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: esgExpertMakerRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to ESG Expert`);
          }
        }
      }
    }

    const securityExpertRole = createdRoles.find((r) => r.name === 'Expert Maker - Security');
    if (securityExpertRole) {
      // Security Expert gets security-related permissions
      const securityPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_SECURITY,
        Permissions.IS_EXPERT,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
      ];

      for (const permissionName of securityPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: securityExpertRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: securityExpertRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Security Expert`);
          }
        }
      }
    }

    const esgExpertRole = createdRoles.find((r) => r.name === 'Expert Maker - Inspection');
    if (esgExpertRole) {
      // ESG Expert gets ESG-related permissions
      const esgPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_INSPECTION,
        Permissions.IS_EXPERT,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
      ];

      for (const permissionName of esgPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: esgExpertRole!.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: esgExpertRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to ESG Expert`);
          }
        }
      }
    }

    const hrHodRole = createdRoles.find((r) => r.name === 'HOD - HR');
    if (hrHodRole) {
      // HR HOD gets HR-related permissions
      const hrHodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_HR,
        Permissions.VIEW_KYC,
      ];

      for (const permissionName of hrHodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: hrHodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: hrHodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to HR HOD`);
          }
        }
      }
    }

    const financeHodRole = createdRoles.find((r) => r.name === 'HOD - Finance');
    if (financeHodRole) {
      // Finance HOD gets Finance-related permissions
      const financeHodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_FINANCE,
        Permissions.VIEW_KYC,
      ];

      for (const permissionName of financeHodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: financeHodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: financeHodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Finance HOD`);
          }
        }
      }
    }

    const legalHodRole = createdRoles.find((r) => r.name === 'HOD - Legal');
    if (legalHodRole) {
      // Legal HOD gets Legal-related permissions
      const legalHodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_LEGAL,
        Permissions.VIEW_KYC,
      ];

      for (const permissionName of legalHodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: legalHodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: legalHodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Legal HOD`);
          }
        }
      }
    }

    const inspectionHodRole = createdRoles.find((r) => r.name === 'HOD - Inspection');
    if (inspectionHodRole) {
      // Inspection HOD gets Inspection-related permissions
      const inspectionHodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_INSPECTION,
        Permissions.VIEW_KYC,
      ];

      for (const permissionName of inspectionHodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: inspectionHodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: inspectionHodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Inspection HOD`);
          }
        }
      }
    }

    const securityHodRole = createdRoles.find((r) => r.name === 'HOD - Security');
    if (securityHodRole) {
      // Security HOD gets Security-related permissions
      const securityHodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_SECURITY,
        Permissions.VIEW_KYC,
      ];

      for (const permissionName of securityHodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: securityHodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: securityHodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Security HOD`);
          }
        }
      }
    }

    const technicalHodRole = createdRoles.find((r) => r.name === 'HOD - Technical');
    if (technicalHodRole) {
      // Technical HOD gets Technical-related permissions
      const technicalHodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_TECHNICAL,
        Permissions.VIEW_KYC,
      ];

      for (const permissionName of technicalHodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: technicalHodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: technicalHodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to Technical HOD`);
          }
        }
      }
    }

    const esgHodRole = createdRoles.find((r) => r.name === 'HOD - ESG');
    if (esgHodRole) {
      // ESG HOD gets ESG-related permissions
      const esgHodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.IS_ESG,
        Permissions.VIEW_KYC,
      ];

      for (const permissionName of esgHodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: esgHodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: esgHodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to ESG HOD`);
          }
        }
      }
    }


    const hodRole = createdRoles.find((r) => r.name === 'HOD - Final Review');
    if (hodRole) {
      // HOD gets HOD-related permissions
      const hodPermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.IS_HOD,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.WAREHOUSE_OPERATOR_REVIEW,
        Permissions.VIEW_KYC,
        Permissions.REVIEW_ASSESSMENT
      ];

      for (const permissionName of hodPermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: hodRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: hodRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to HOD`);
          }
        }
      }
    }

    const ceoCommitteeRole = createdRoles.find((r) => r.name === 'CEO/Committee');
    if (ceoCommitteeRole) {
      // CEO/Committee gets CEO/Committee-related permissions
      const ceoCommitteePermissions = [
        Permissions.VIEW_ALL_APPLICATIONS,
        Permissions.VIEW_APPLICATION,
        Permissions.VIEW_FINANCE_REPORTS,
        Permissions.APPROVE_FINANCE,
        Permissions.UPDATE_APPLICATION_STATUS,
        Permissions.WAREHOUSE_OPERATOR_DESCISION,
        Permissions.VIEW_WAREHOUSE_APPLICATION_ASSIGNMENT,
        Permissions.VIEW_KYC,
        Permissions.REVIEW_FINAL_APPLICATION,
        Permissions.FINAL_APPROVAL_USER,
        Permissions.MANAGE_EXPERT_ASSESSMENT,
      ];

      for (const permissionName of ceoCommitteePermissions) {
        const permission = createdPermissions.find((p) => p.name === permissionName);
        if (permission) {
          const exists = await rolePermissionRepository.findOne({
            where: {
              roleId: ceoCommitteeRole.id,
              permissionId: permission.id,
            },
          });

          if (!exists) {
            const rolePermission = rolePermissionRepository.create({
              roleId: ceoCommitteeRole.id,
              permissionId: permission.id,
            });
            await rolePermissionRepository.save(rolePermission);
            console.log(`✓ Assigned permission ${permission.name} to CEO/Committee`);
          }
        }
      }
    }

    console.log('\n✅ RBAC seeding completed!');
  }
}

