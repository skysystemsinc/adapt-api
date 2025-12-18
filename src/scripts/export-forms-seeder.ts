import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { FormsSeeder } from '../database/seeders/forms.seeder';
import * as fs from 'fs';
import * as path from 'path';

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

async function exportFormsSeeder() {
  try {
    console.log('🔄 Connecting to database...\n');

    await AppDataSource.initialize();
    console.log('✓ Database connection established\n');

    const seeder = new FormsSeeder();
    await seeder.export(AppDataSource);

    console.log('\n✅ Export completed successfully!');
    console.log('\nℹ️  The seeder content has been displayed above.');
    console.log('Copy it and replace the content in src/database/seeders/forms.seeder.ts\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

exportFormsSeeder();

