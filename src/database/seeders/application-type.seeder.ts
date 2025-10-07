import { DataSource } from 'typeorm';
import { ApplicationType } from '../../modules/application-type/entities/application-type.entity';

export class ApplicationTypeSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(ApplicationType);

    const applicationTypes = [
      {
        name: 'Individual Application',
        slug: 'individual-application',
        isActive: true,
      },
      {
        name: 'AOP',
        slug: 'aop',
        isActive: true,
      },
      {
        name: 'Private Limited',
        slug: 'private-limited',
        isActive: true,
      },
      {
        name: 'Public Limited',
        slug: 'public-limited',
        isActive: true,
      },
    ];

    for (const appType of applicationTypes) {
      const exists = await repository.findOne({
        where: { slug: appType.slug },
      });

      if (!exists) {
        const entity = repository.create(appType);
        await repository.save(entity);
        console.log(`✓ Created application type: ${appType.name}`);
      } else {
        console.log(`- Application type already exists: ${appType.name}`);
      }
    }
  }
}

