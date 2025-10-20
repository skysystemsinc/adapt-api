import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export class UserSeeder {
  private readonly saltRounds = 10;

  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(User);

    const users = [
      {
        email: 'admin@example.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      },
      {
        email: 'john.doe@example.com',
        password: 'User@123',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      },
      {
        email: 'jane.smith@example.com',
        password: 'User@123',
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
      },
    ];

    for (const userData of users) {
      const exists = await repository.findOne({
        where: { email: userData.email },
      });

      if (!exists) {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
        
        const entity = repository.create({
          ...userData,
          password: hashedPassword,
        });
        
        await repository.save(entity);
        console.log(`✓ Created user: ${userData.email}`);
      } else {
        console.log(`- User already exists: ${userData.email}`);
      }
    }
  }
}

