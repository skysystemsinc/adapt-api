import { DataSource } from 'typeorm';
import { AuthorityLevel } from '../../modules/authority-level/entities/authority-level.entity';

export class AuthorityLevelSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(AuthorityLevel);

    const authorityLevels = [
      {
        name: 'Level 1 - Basic',
        slug: 'level-1-basic',
        isActive: true,
      },
      {
        name: 'Level 2 - Standard',
        slug: 'level-2-standard',
        isActive: true,
      },
      {
        name: 'Level 3 - Advanced',
        slug: 'level-3-advanced',
        isActive: true,
      },
    ];

    for (const authorityLevel of authorityLevels) {
      const exists = await repository.findOne({
        where: { slug: authorityLevel.slug },
      });

      if (!exists) {
        const entity = repository.create(authorityLevel);
        await repository.save(entity);
        console.log(`✓ Created authority level: ${authorityLevel.name}`);
      } else {
        console.log(`- Authority level already exists: ${authorityLevel.name}`);
      }
    }
  }
}
