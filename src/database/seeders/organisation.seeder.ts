import { DataSource } from 'typeorm';
import { Organization, OrganizationStatus, OrganizationType } from '../../modules/organization/entities/organization.entity';

export class OrganisationSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Organization);

    const organisations = [
      {
        code: 'ORG-001',
        name: 'NCMCL',
        slug: 'ncmcl',
        status: OrganizationStatus.ACTIVE,
        type: OrganizationType.INTERNAL,
      },
      {
        code: 'ORG-002',
        name: 'Organisation 2',
        slug: 'organisation-2',
        status: OrganizationStatus.ACTIVE,
        type: OrganizationType.EXTERNAL,
      },
      {
        code: 'ORG-003',
        name: 'Organisation 3',
        slug: 'organisation-3',
        status: OrganizationStatus.ACTIVE,
        type: OrganizationType.EXTERNAL,
      },
      {
        code: 'ORG-004',
        name: 'Organisation 4',
        slug: 'organisation-4',
        status: OrganizationStatus.ACTIVE,
        type: OrganizationType.EXTERNAL,
      },
    ];

    for (const organisationData of organisations) {
      const exists = await repository.findOne({
        where: { code: organisationData.code },
      });

      if (!exists) {
        const entity = repository.create(organisationData);
        await repository.save(entity);
        console.log(`✓ Created organisation: ${organisationData.code}`);
      } else {
        console.log(`- Organisation already exists: ${organisationData.code}`);
      }
    }
  }
}

