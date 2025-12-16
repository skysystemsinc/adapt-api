

import { DataSource } from 'typeorm';
import { Role } from '../../modules/rbac/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RBACService } from '../../modules/rbac/services/rbac.service';
import { UserRole } from '../../modules/rbac/entities/user-role.entity';
import { RolePermission } from '../../modules/rbac/entities/role-permission.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';

export class AdminSeeder {
    public async run(dataSource: DataSource): Promise<void> {

        const roleRepository = dataSource.getRepository(Role);
        const rbacService = new RBACService(
            dataSource.getRepository(UserRole),
            dataSource.getRepository(RolePermission),
            dataSource.getRepository(Permission),
            dataSource.getRepository(Role)
        );
        console.log('🌱 Seeding Super Admin user and role...\n');

        const superAdminRole = await roleRepository.findOne({
            where: { name: 'Super Admin' },
        });


        const hodFinanceRole = await roleRepository.findOne({
            where: { name: 'HOD - Finance' },
        });

        const hodLegalRole = await roleRepository.findOne({
            where: { name: 'HOD - Legal' },
        });

        const hodHrRole = await roleRepository.findOne({
            where: { name: 'HOD - HR' },
        });

        const hodTechnicalRole = await roleRepository.findOne({
            where: { name: 'HOD - Technical' },
        });

        const hodEsgRole = await roleRepository.findOne({
            where: { name: 'HOD - ESG' },
        });

        const hodInspectionRole = await roleRepository.findOne({
            where: { name: 'HOD - Inspection' },
        });

        const hodSecurityRole = await roleRepository.findOne({
            where: { name: 'HOD - Security' },
        });

        const makerFinanceExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Maker - Finance' },
        });

        const checkerFinanceExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Checker - Finance' },
        });

        const makerLegalExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Maker - Legal' },
        });

        const checkerLegalExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Checker - Legal' },
        });
        
        const makerHrExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Maker - HR' },
        });

        const checkerHrExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Checker - HR' },
        });
        
        const makerInspectionExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Maker - Inspection' },
        });

        const checkerInspectionExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Checker - Inspection' },
        });

        const makerSecurityExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Maker - Security' },
        });

        const checkerSecurityExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Checker - Security' },
        });

        const makerTechnicalExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Maker - Technical' },
        });

        const checkerTechnicalExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Checker - Technical' },
        });

        const makerEsgExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Maker - ESG' },
        });

        const checkerEsgExpertRole = await roleRepository.findOne({
            where: { name: 'Expert Checker - ESG' },
        });

        const hodFinalReviewRole = await roleRepository.findOne({
            where: { name: 'HOD - Final Review' },
        });

        const ceoCommitteeRole = await roleRepository.findOne({
            where: { name: 'CEO/Committee' },
        });

            
        if (!superAdminRole) {
            const newSuperAdminRole = roleRepository.create({
                name: 'Super Admin',
                description: 'Super Admin who has all permissions',
            });
            const savedSuperAdminRole = await roleRepository.save(newSuperAdminRole);
            console.log(`✓ Created super admin role: ${savedSuperAdminRole.name}`);
        }

        if (!hodFinanceRole) {
            const newHodFinanceRole = roleRepository.create({
                name: 'HOD - Finance',
                description: 'HOD - Finance who has all permissions',
            });
            const savedHodFinanceRole = await roleRepository.save(newHodFinanceRole);
            console.log(`✓ Created HOD - Finance role: ${savedHodFinanceRole.name}`);
        }
        
        if (!hodLegalRole) {
            const newHodLegalRole = roleRepository.create({
                name: 'HOD - Legal',
                description: 'HOD - Legal who has all permissions',
            });
            const savedHodLegalRole = await roleRepository.save(newHodLegalRole);
            console.log(`✓ Created HOD - Legal role: ${savedHodLegalRole.name}`);
        }
        
        if (!hodHrRole) {
            const newHodHrRole = roleRepository.create({
                name: 'HOD - HR',
                description: 'HOD - HR who has all permissions',
            });
            const savedHodHrRole = await roleRepository.save(newHodHrRole);
            console.log(`✓ Created HOD - HR role: ${savedHodHrRole.name}`);
        }
        
        if (!hodTechnicalRole) {
            const newHodTechnicalRole = roleRepository.create({
                name: 'HOD - Technical',
                description: 'HOD - Technical who has all permissions',
            });
            const savedHodTechnicalRole = await roleRepository.save(newHodTechnicalRole);
            console.log(`✓ Created HOD - Technical role: ${savedHodTechnicalRole.name}`);
        }
        
        if (!hodEsgRole) {
            const newHodEsgRole = roleRepository.create({
                name: 'HOD - ESG',
                description: 'HOD - ESG who has all permissions',
            });
            const savedHodEsgRole = await roleRepository.save(newHodEsgRole);
            console.log(`✓ Created HOD - ESG role: ${savedHodEsgRole.name}`);
        }
        
        if (!hodInspectionRole) {
            const newHodInspectionRole = roleRepository.create({
                name: 'HOD - Inspection',
                description: 'HOD - Inspection who has all permissions',
            });
            const savedHodInspectionRole = await roleRepository.save(newHodInspectionRole);
            console.log(`✓ Created HOD - Inspection role: ${savedHodInspectionRole.name}`);
        }
        
        if (!hodSecurityRole) {
            const newHodSecurityRole = roleRepository.create({
                name: 'HOD - Security',
                description: 'HOD - Security who has all permissions',
            });
            const savedHodSecurityRole = await roleRepository.save(newHodSecurityRole);
            console.log(`✓ Created HOD - Security role: ${savedHodSecurityRole.name}`);
        }
        
        if (!makerFinanceExpertRole) {
            const newMakerFinanceExpertRole = roleRepository.create({
                name: 'Expert Maker - Finance',
                description: 'Expert Maker - Finance who has all permissions',
            });
            const savedMakerFinanceExpertRole = await roleRepository.save(newMakerFinanceExpertRole);
            console.log(`✓ Created Expert Maker - Finance role: ${savedMakerFinanceExpertRole.name}`);
        }
        
        if (!checkerFinanceExpertRole) {
            const newCheckerFinanceExpertRole = roleRepository.create({
                name: 'Expert Checker - Finance',
                description: 'Expert Checker - Finance who has all permissions',
            });
            const savedCheckerFinanceExpertRole = await roleRepository.save(newCheckerFinanceExpertRole);
            console.log(`✓ Created Expert Checker - Finance role: ${savedCheckerFinanceExpertRole.name}`);
        }

        if (!makerLegalExpertRole) {
            const newMakerLegalExpertRole = roleRepository.create({
                name: 'Expert Maker - Legal',
                description: 'Expert Maker - Legal who has all permissions',
            });
            const savedMakerLegalExpertRole = await roleRepository.save(newMakerLegalExpertRole);
            console.log(`✓ Created Expert Maker - Legal role: ${savedMakerLegalExpertRole.name}`);
        }
        
        if (!checkerLegalExpertRole) {
            const newCheckerLegalExpertRole = roleRepository.create({
                name: 'Expert Checker - Legal',
                description: 'Expert Checker - Legal who has all permissions',
            });
            const savedCheckerLegalExpertRole = await roleRepository.save(newCheckerLegalExpertRole);
            console.log(`✓ Created Expert Checker - Legal role: ${savedCheckerLegalExpertRole.name}`);
        }
        
        if (!makerHrExpertRole) {
            const newMakerHrExpertRole = roleRepository.create({
                name: 'Expert Maker - HR',
                description: 'Expert Maker - HR who has all permissions',
            });
            const savedMakerHrExpertRole = await roleRepository.save(newMakerHrExpertRole);
            console.log(`✓ Created Expert Maker - HR role: ${savedMakerHrExpertRole.name}`);
        }
        
        if (!checkerHrExpertRole) {
            const newCheckerHrExpertRole = roleRepository.create({
                name: 'Expert Checker - HR',
                description: 'Expert Checker - HR who has all permissions',
            });
            const savedCheckerHrExpertRole = await roleRepository.save(newCheckerHrExpertRole);
            console.log(`✓ Created Expert Checker - HR role: ${savedCheckerHrExpertRole.name}`);
        }
        
        if (!makerInspectionExpertRole) {
            const newMakerInspectionExpertRole = roleRepository.create({
                name: 'Expert Maker - Inspection',
                description: 'Expert Maker - Inspection who has all permissions',
            });
            const savedMakerInspectionExpertRole = await roleRepository.save(newMakerInspectionExpertRole);
            console.log(`✓ Created Expert Maker - Inspection role: ${savedMakerInspectionExpertRole.name}`);
        }

        if (!checkerInspectionExpertRole) {
            const newCheckerInspectionExpertRole = roleRepository.create({
                name: 'Expert Checker - Inspection',
                description: 'Expert Checker - Inspection who has all permissions',
            });
            const savedCheckerInspectionExpertRole = await roleRepository.save(newCheckerInspectionExpertRole);
            console.log(`✓ Created Expert Checker - Inspection role: ${savedCheckerInspectionExpertRole.name}`);
        }

        if (!makerSecurityExpertRole) {
            const newMakerSecurityExpertRole = roleRepository.create({
                name: 'Expert Maker - Security',
                description: 'Expert Maker - Security who has all permissions',
            });
            const savedMakerSecurityExpertRole = await roleRepository.save(newMakerSecurityExpertRole);
            console.log(`✓ Created Expert Maker - Security role: ${savedMakerSecurityExpertRole.name}`);
        }

        if (!checkerSecurityExpertRole) {
            const newCheckerSecurityExpertRole = roleRepository.create({
                name: 'Expert Checker - Security',
                description: 'Expert Checker - Security who has all permissions',
            });
            const savedCheckerSecurityExpertRole = await roleRepository.save(newCheckerSecurityExpertRole);
            console.log(`✓ Created Expert Checker - Security role: ${savedCheckerSecurityExpertRole.name}`);
        }

        if (!makerTechnicalExpertRole) {
            const newMakerTechnicalExpertRole = roleRepository.create({
                name: 'Expert Maker - Technical',
                description: 'Expert Maker - Technical who has all permissions',
            });
            const savedMakerTechnicalExpertRole = await roleRepository.save(newMakerTechnicalExpertRole);
            console.log(`✓ Created Expert Maker - Technical role: ${savedMakerTechnicalExpertRole.name}`);
        }


        if (!checkerTechnicalExpertRole) {
            const newCheckerTechnicalExpertRole = roleRepository.create({
                name: 'Expert Checker - Technical',
                description: 'Expert Checker - Technical who has all permissions',
            });
            const savedCheckerTechnicalExpertRole = await roleRepository.save(newCheckerTechnicalExpertRole);
            console.log(`✓ Created Expert Checker - Technical role: ${savedCheckerTechnicalExpertRole.name}`);
        }

        if (!makerEsgExpertRole) {
            const newMakerEsgExpertRole = roleRepository.create({
                name: 'Expert Maker - ESG',
                description: 'Expert Maker - ESG who has all permissions',
            });
            const savedMakerEsgExpertRole = await roleRepository.save(newMakerEsgExpertRole);
            console.log(`✓ Created Expert Maker - ESG role: ${savedMakerEsgExpertRole.name}`);
        }
        
        if (!checkerEsgExpertRole) {
            const newCheckerEsgExpertRole = roleRepository.create({
                name: 'Expert Checker - ESG',
                description: 'Expert Checker - ESG who has all permissions',
            });
            const savedCheckerEsgExpertRole = await roleRepository.save(newCheckerEsgExpertRole);
            console.log(`✓ Created Expert Checker - ESG role: ${savedCheckerEsgExpertRole.name}`);
        }
        
        if (!hodFinalReviewRole) {
            const newHodFinalReviewRole = roleRepository.create({
                name: 'HOD - Final Review',
                description: 'HOD - Final Review who has all permissions',
            });
            const savedHodFinalReviewRole = await roleRepository.save(newHodFinalReviewRole);
            console.log(`✓ Created HOD - Final Review role: ${savedHodFinalReviewRole.name}`);
        }

        if (!ceoCommitteeRole) {
            const newCeoCommitteeRole = roleRepository.create({
                name: 'CEO/Committee',
                description: 'CEO/Committee who has all permissions',
            });
            const savedCeoCommitteeRole = await roleRepository.save(newCeoCommitteeRole);
            console.log(`✓ Created CEO/Committee role: ${savedCeoCommitteeRole.name}`);
        }

        // Helper function to generate email from role name
        const generateEmailFromRole = (roleName: string): string => {
            const roleLower = roleName.toLowerCase();
            let emailPrefix = '';
            
            if (roleLower.includes('hod -')) {
                const department = roleLower.replace('hod -', '').trim();
                if (department === 'hr') {
                    emailPrefix = 'hr-hod';
                } else if (department === 'technical') {
                    emailPrefix = 'technical-hod';
                } else if (department === 'finance') {
                    emailPrefix = 'finance-hod';
                } else if (department === 'legal') {
                    emailPrefix = 'legal-hod';
                } else if (department === 'esg') {
                    emailPrefix = 'esg-hod';
                } else if (department === 'inspection') {
                    emailPrefix = 'inspection-hod';
                } else if (department === 'security') {
                    emailPrefix = 'security-hod';
                } else if (department === 'final review') {
                    emailPrefix = 'final-review-hod';
                } else {
                    emailPrefix = `${department.replace(/\s+/g, '-')}-hod`;
                }
            } else if (roleLower.includes('expert maker -')) {
                const department = roleLower.replace('expert maker -', '').trim();
                emailPrefix = `${department}-expert-maker`;
            } else if (roleLower.includes('expert checker -')) {
                const department = roleLower.replace('expert checker -', '').trim();
                emailPrefix = `${department}-expert-checker`;
            } else if (roleLower === 'super admin') {
                emailPrefix = 'admin';
                return `${emailPrefix}@example.com`;
            } else if (roleLower === 'ceo/committee') {
                emailPrefix = 'ceo-committee';
            } else {
                emailPrefix = roleLower.replace(/\s+/g, '-').replace(/\//g, '-');
            }
            
            return `${emailPrefix}@ncmcl.com`;
        };

        // Helper function to generate name from role
        const generateNameFromRole = (roleName: string): { firstName: string; lastName: string } => {
            if (roleName.includes('HOD -')) {
                const department = roleName.replace('HOD -', '').trim();
                return { firstName: 'HOD', lastName: department };
            } else if (roleName.includes('Expert Maker -')) {
                const department = roleName.replace('Expert Maker -', '').trim();
                return { firstName: 'Expert', lastName: `${department} Maker` };
            } else if (roleName.includes('Expert Checker -')) {
                const department = roleName.replace('Expert Checker -', '').trim();
                return { firstName: 'Expert', lastName: `${department} Checker` };
            } else if (roleName === 'Super Admin') {
                return { firstName: 'Super', lastName: 'Admin' };
            } else if (roleName === 'CEO/Committee') {
                return { firstName: 'CEO', lastName: 'Committee' };
            }
            return { firstName: roleName.split(' ')[0] || 'User', lastName: roleName.split(' ').slice(1).join(' ') || 'User' };
        };

        // Get all roles again (including newly created ones)
        const finalSuperAdminRole = await roleRepository.findOne({ where: { name: 'Super Admin' } });
        const finalHodFinanceRole = await roleRepository.findOne({ where: { name: 'HOD - Finance' } });
        const finalHodLegalRole = await roleRepository.findOne({ where: { name: 'HOD - Legal' } });
        const finalHodHrRole = await roleRepository.findOne({ where: { name: 'HOD - HR' } });
        const finalHodTechnicalRole = await roleRepository.findOne({ where: { name: 'HOD - Technical' } });
        const finalHodEsgRole = await roleRepository.findOne({ where: { name: 'HOD - ESG' } });
        const finalHodInspectionRole = await roleRepository.findOne({ where: { name: 'HOD - Inspection' } });
        const finalHodSecurityRole = await roleRepository.findOne({ where: { name: 'HOD - Security' } });
        const finalMakerFinanceExpertRole = await roleRepository.findOne({ where: { name: 'Expert Maker - Finance' } });
        const finalCheckerFinanceExpertRole = await roleRepository.findOne({ where: { name: 'Expert Checker - Finance' } });
        const finalMakerLegalExpertRole = await roleRepository.findOne({ where: { name: 'Expert Maker - Legal' } });
        const finalCheckerLegalExpertRole = await roleRepository.findOne({ where: { name: 'Expert Checker - Legal' } });
        const finalMakerHrExpertRole = await roleRepository.findOne({ where: { name: 'Expert Maker - HR' } });
        const finalCheckerHrExpertRole = await roleRepository.findOne({ where: { name: 'Expert Checker - HR' } });
        const finalMakerInspectionExpertRole = await roleRepository.findOne({ where: { name: 'Expert Maker - Inspection' } });
        const finalCheckerInspectionExpertRole = await roleRepository.findOne({ where: { name: 'Expert Checker - Inspection' } });
        const finalMakerSecurityExpertRole = await roleRepository.findOne({ where: { name: 'Expert Maker - Security' } });
        const finalCheckerSecurityExpertRole = await roleRepository.findOne({ where: { name: 'Expert Checker - Security' } });
        const finalMakerTechnicalExpertRole = await roleRepository.findOne({ where: { name: 'Expert Maker - Technical' } });
        const finalCheckerTechnicalExpertRole = await roleRepository.findOne({ where: { name: 'Expert Checker - Technical' } });
        const finalMakerEsgExpertRole = await roleRepository.findOne({ where: { name: 'Expert Maker - ESG' } });
        const finalCheckerEsgExpertRole = await roleRepository.findOne({ where: { name: 'Expert Checker - ESG' } });
        const finalHodFinalReviewRole = await roleRepository.findOne({ where: { name: 'HOD - Final Review' } });
        const finalCeoCommitteeRole = await roleRepository.findOne({ where: { name: 'CEO/Committee' } });

        // Create users for all roles
        const userRepository = dataSource.getRepository(User);
        const rolesToCreateUsers = [
            { role: finalSuperAdminRole, roleName: 'Super Admin' },
            { role: finalHodFinanceRole, roleName: 'HOD - Finance' },
            { role: finalHodLegalRole, roleName: 'HOD - Legal' },
            { role: finalHodHrRole, roleName: 'HOD - HR' },
            { role: finalHodTechnicalRole, roleName: 'HOD - Technical' },
            { role: finalHodEsgRole, roleName: 'HOD - ESG' },
            { role: finalHodInspectionRole, roleName: 'HOD - Inspection' },
            { role: finalHodSecurityRole, roleName: 'HOD - Security' },
            { role: finalMakerFinanceExpertRole, roleName: 'Expert Maker - Finance' },
            { role: finalCheckerFinanceExpertRole, roleName: 'Expert Checker - Finance' },
            { role: finalMakerLegalExpertRole, roleName: 'Expert Maker - Legal' },
            { role: finalCheckerLegalExpertRole, roleName: 'Expert Checker - Legal' },
            { role: finalMakerHrExpertRole, roleName: 'Expert Maker - HR' },
            { role: finalCheckerHrExpertRole, roleName: 'Expert Checker - HR' },
            { role: finalMakerInspectionExpertRole, roleName: 'Expert Maker - Inspection' },
            { role: finalCheckerInspectionExpertRole, roleName: 'Expert Checker - Inspection' },
            { role: finalMakerSecurityExpertRole, roleName: 'Expert Maker - Security' },
            { role: finalCheckerSecurityExpertRole, roleName: 'Expert Checker - Security' },
            { role: finalMakerTechnicalExpertRole, roleName: 'Expert Maker - Technical' },
            { role: finalCheckerTechnicalExpertRole, roleName: 'Expert Checker - Technical' },
            { role: finalMakerEsgExpertRole, roleName: 'Expert Maker - ESG' },
            { role: finalCheckerEsgExpertRole, roleName: 'Expert Checker - ESG' },
            { role: finalHodFinalReviewRole, roleName: 'HOD - Final Review' },
            { role: finalCeoCommitteeRole, roleName: 'CEO/Committee' },
        ];

        console.log('\n🌱 Creating users for all roles...\n');

        for (const { role, roleName } of rolesToCreateUsers) {
            if (!role) {
                console.log(`⚠ Skipping user creation for ${roleName} - role not found`);
                continue;
            }

            const email = generateEmailFromRole(roleName);
            const { firstName, lastName } = generateNameFromRole(roleName);
            const defaultPassword = 'Password@123';

            const existingUser = await userRepository.findOne({
                where: { email },
            });

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                const newUser = userRepository.create({
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    isActive: true,
                });
                const savedUser = await userRepository.save(newUser);
                await rbacService.assignRolesToUser(savedUser.id, [role.id]);
                console.log(`✓ Created user: ${email} with role: ${roleName}`);
            } else {
                // Check if user already has this role
                const userRoles = await rbacService.getUserRoles(existingUser.id);
                const hasRole = userRoles.some(r => r.id === role.id);
                if (!hasRole) {
                    await rbacService.assignRolesToUser(existingUser.id, [role.id]);
                    console.log(`✓ Assigned role ${roleName} to existing user: ${email}`);
                } else {
                    console.log(`- User already exists with role: ${email} (${roleName})`);
                }
            }
        }

        const superAdminUser = {
            email: 'admin@example.com',
            password: 'Admin@123',
            firstName: 'Super',
            lastName: 'Admin',
            isActive: true,
        };

        const existingSuperAdminUser = await userRepository.findOne({
            where: { email: superAdminUser.email },
        });
        // Create a new super admin if it doesn't exist and assign super admin role to it.
        if (!existingSuperAdminUser) {
            const hashedPassword = await bcrypt.hash(superAdminUser.password, 10);
            const newSuperAdminUser = userRepository.create({
                ...superAdminUser,
                password: hashedPassword
            });
            const savedSuperAdminUser = await userRepository.save(newSuperAdminUser);
            console.log(`✓ Created super admin user: ${savedSuperAdminUser.email}`);
            if (finalSuperAdminRole) {
                await rbacService.assignRolesToUser(savedSuperAdminUser.id, [finalSuperAdminRole.id]);
            }
            console.log(`✓ Assigned super admin role to user: ${superAdminUser.email}`);
        } else {
            console.log(`- Super admin user already exists: ${superAdminUser.email}`);
        }
        
        console.log('\n✅ Super admin user seeding completed!');


    }
}