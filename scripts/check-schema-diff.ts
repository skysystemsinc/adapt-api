import { DataSource } from 'typeorm';
import { config } from 'dotenv';

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

async function checkSchemaDiff() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Check ALL columns in assignment table
    console.log('=== Assignment table - ALL columns ===\n');
    
    const assignmentColumns = await queryRunner.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'assignment'
      ORDER BY ordinal_position;
    `);
    
    console.log('Assignment table columns:');
    console.log(JSON.stringify(assignmentColumns, null, 2));
    console.log('\n');

    // Check ALL columns in assignment_history table
    console.log('=== Assignment_history table - ALL columns ===\n');
    
    const assignmentHistoryColumns = await queryRunner.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'assignment_history'
      ORDER BY ordinal_position;
    `);
    
    console.log('Assignment_history table columns:');
    console.log(JSON.stringify(assignmentHistoryColumns, null, 2));
    console.log('\n');

    // Check assignment_section_fields table
    console.log('=== Assignment_section_fields table - ALL columns ===\n');
    
    const assignmentSectionFieldsColumns = await queryRunner.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'assignment_section_fields'
      ORDER BY ordinal_position;
    `);
    
    console.log('Assignment_section_fields table columns:');
    console.log(JSON.stringify(assignmentSectionFieldsColumns, null, 2));
    console.log('\n');

    // Check assignment_section_fields_history table
    console.log('=== Assignment_section_fields_history table - ALL columns ===\n');
    
    const assignmentSectionFieldsHistoryColumns = await queryRunner.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'assignment_section_fields_history'
      ORDER BY ordinal_position;
    `);
    
    console.log('Assignment_section_fields_history table columns:');
    console.log(JSON.stringify(assignmentSectionFieldsHistoryColumns, null, 2));
    console.log('\n');

    // Check enum values
    console.log('=== Enum type values ===\n');
    
    const enumTypes = await queryRunner.query(`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname LIKE '%assignment%'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);
    
    console.log('Enum types and values:');
    console.log(JSON.stringify(enumTypes, null, 2));
    console.log('\n');

    await queryRunner.release();
    await AppDataSource.destroy();
    
    console.log('✅ Schema check completed');
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }
}

checkSchemaDiff();

