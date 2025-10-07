import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AuthorityLevelSeeder } from './authority-level.seeder';

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

async function runAuthorityLevelSeeder() {
  try {
    console.log('🌱 Starting Authority Level seeding...\n');

    await AppDataSource.initialize();
    console.log('✓ Database connection established\n');

    // Run authority level seeder only
    const authorityLevelSeeder = new AuthorityLevelSeeder();
    await authorityLevelSeeder.run(AppDataSource);

    console.log('\n✅ Authority Level seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Authority Level seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runAuthorityLevelSeeder();
