

import { DataSource } from 'typeorm';
import { Role } from '../../modules/rbac/entities/role.entity';

export class RolesSeeder {
    public async run(dataSource: DataSource): Promise<void> {

        const roles = [
            { name: 'Applicant', description: 'User who submits registration applications' },
            { name: 'Scrutiny Officer', description: 'Officer who reviews and verifies applications' },
            { name: 'HOD', description: 'Head of Department who reviews and verifies applications' },
            { name: 'HOD - Finance', description: 'Head of Department who reviews and verifies financial applications' },
            { name: 'HOD - Legal', description: 'Head of Department who reviews and verifies legal applications' },
            { name: 'HOD - HR', description: 'Head of Department who reviews and verifies HR applications' },
            { name: 'HOD - Inspection', description: 'Head of Department who reviews and verifies inspection applications' },
            { name: 'HOD - Security', description: 'Head of Department who reviews and verifies security applications' },
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
            { name: 'HOD - Final Review', description: 'Head of Department who reviews and verifies final applications' },
            { name: 'CEO/Committee', description: 'CEO or Committee who reviews and verifies applications' },
        ];

    const roleRepository = dataSource.getRepository(Role);

    console.log('🌱 Seeding Roles data...\n');

        const createdRoles: Role[] = [];

    for(const roleData of roles) {
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

    console.log('\n✅ Roles seeding completed!');
}
}