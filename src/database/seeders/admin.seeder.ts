

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
        if (!superAdminRole) {
            const newSuperAdminRole = roleRepository.create({
                name: 'Super Admin',
                description: 'Super Admin who has all permissions',
            });
            const savedSuperAdminRole = await roleRepository.save(newSuperAdminRole);
            console.log(`✓ Created super admin role: ${savedSuperAdminRole.name}`);
        }

        const superAdminUser = {
            email: 'admin@ncmcl.com',
            password: 'Admin@123',
            firstName: 'Super',
            lastName: 'Admin',
            isActive: true,
        };

        const userRepository = dataSource.getRepository(User);
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
            await rbacService.assignRolesToUser(savedSuperAdminUser.id, [superAdminRole!.id]);
            console.log(`✓ Created super admin user: ${superAdminUser.email}`);
        } else {
            console.log(`- Super admin user already exists: ${superAdminUser.email}`);
        }
        console.log('\n✅ Super admin user seeding completed!');
    }
}