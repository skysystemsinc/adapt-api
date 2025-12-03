import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ApplicationTypeSeeder } from './application-type.seeder';
import { UserSeeder } from './user.seeder';
import { RBACSeeder } from './rbac.seeder';
import { DocumentTypeSeeder } from './document-type.seeder';
import { SettingsSeeder } from './settings.seeder';
import { DesignationSeeder } from './designation.seeder';
import { OrganisationSeeder } from './organisation.seeder';
import { ExpertAssessmentSeeder } from './expert-assessment.seeder';
import { RolesSeeder } from './roles.seeder';
import { AdminSeeder } from './admin.seeder';
// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ncmcl_db',
  entities: ['src/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function runSeeders() {
  try {
    console.log('🌱 Starting database seeding...\n');

    await AppDataSource.initialize();
    console.log('✓ Database connection established\n');

    // Run seeders
    // const applicationTypeSeeder = new ApplicationTypeSeeder();
    // await applicationTypeSeeder.run(AppDataSource);

    // const userSeeder = new UserSeeder();
    // await userSeeder.run(AppDataSource);

    // const rbacSeeder = new RBACSeeder();
    // await rbacSeeder.run(AppDataSource);

    // const documentTypeSeeder = new DocumentTypeSeeder();
    // await documentTypeSeeder.run(AppDataSource);

    // const settingsSeeder = new SettingsSeeder();
    // await settingsSeeder.run(AppDataSource);

    // const designationSeeder = new DesignationSeeder();
    // await designationSeeder.run(AppDataSource);

    // const organisationSeeder = new OrganisationSeeder();
    // await organisationSeeder.run(AppDataSource);

    // const expertAssessmentSeeder = new ExpertAssessmentSeeder();
    // await expertAssessmentSeeder.run(AppDataSource);
    
    const rolesSeeder = new RolesSeeder();
    await rolesSeeder.run(AppDataSource);

    const adminSeeder = new AdminSeeder();
    await adminSeeder.run(AppDataSource);

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runSeeders();

