import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '../../.env') });

import { Form } from '../modules/forms/entities/form.entity';
import { FormField } from '../modules/forms/entities/form-field.entity';

/**
 * Migration script to migrate form schema data to form_fields table
 * 
 * This script:
 * - Loops through all forms with schema data
 * - Parses schema and creates form_field records
 * - Preserves field IDs, step numbers, order
 * - Handles heading fields with title property
 * - Logs migration results
 */

interface ParsedField {
  fieldKey: string;
  label?: string;
  title?: string; // For heading fields
  type: string;
  options?: any;
  required: boolean;
  isSingle: boolean;
  placeholder?: string;
  validation?: any;
  conditions?: any;
  order: number;
  step: number;
  metadata?: any;
}

function parseFieldsFromSchema(schema: Record<string, any>): ParsedField[] {
  const fields: ParsedField[] = [];
  let globalOrder = 0;

  if (!schema.steps || !Array.isArray(schema.steps)) {
    return fields;
  }

  schema.steps.forEach((step: any, stepIndex: number) => {
    if (!step.fields || !Array.isArray(step.fields)) {
      return;
    }

    // Store step title in metadata of first field
    const stepTitle = step.title || `Step ${stepIndex + 1}`;

    step.fields.forEach((field: any, fieldIndex: number) => {
      // Generate fieldKey from field ID or position
      const fieldKey = field.id || `field_${globalOrder + 1}`;

      // Determine if checkbox is single or multiple
      const isSingle = field.type === 'checkbox' && field.isSingle === true;

      // For heading fields, use title property instead of label
      const isHeading = field.type === 'heading';

      // Extract field properties
      const parsedField: ParsedField = {
        fieldKey,
        label: !isHeading ? field.label : undefined,
        title: isHeading ? field.title : undefined,
        type: field.type || 'text',
        options: isSingle ? null : (field.options || null),
        required: field.required || false,
        isSingle,
        placeholder: field.placeholder,
        validation: field.validation,
        conditions: field.conditions,
        order: globalOrder,
        step: stepIndex,
        metadata: fieldIndex === 0 ? { stepTitle } : null, // Store step title in first field's metadata
      };

      fields.push(parsedField);
      globalOrder++;
    });
  });

  return fields;
}

async function migrateSchemaToFields() {
  console.log('🚀 Starting migration of schema data to form_fields table...\n');

  // Create data source
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'adapt',
    entities: [Form, FormField],
    synchronize: false,
  });

  try {
    // Initialize data source
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Get all forms with schema
    const forms = await dataSource.getRepository(Form).find();
    console.log(`📋 Found ${forms.length} forms to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const form of forms) {
      try {
        console.log(`\n📝 Processing form: "${form.title}" (ID: ${form.id})`);

        // Skip if no schema
        if (!form.schema || Object.keys(form.schema).length === 0) {
          console.log('   ⏭️  No schema found, skipping...');
          skippedCount++;
          continue;
        }

        // Check if fields already exist
        const existingFields = await dataSource
          .getRepository(FormField)
          .count({ where: { formId: form.id } });

        if (existingFields > 0) {
          console.log(
            `   ⏭️  Already has ${existingFields} fields, skipping...`,
          );
          skippedCount++;
          continue;
        }

        // Parse schema
        const parsedFields = parseFieldsFromSchema(form.schema);
        console.log(`   📊 Parsed ${parsedFields.length} fields from schema`);

        if (parsedFields.length === 0) {
          console.log('   ⏭️  No fields to migrate, skipping...');
          skippedCount++;
          continue;
        }

        // Create field records in a transaction
        await dataSource.transaction(async (manager) => {
          for (const parsedField of parsedFields) {
            const field = manager.create(FormField, {
              formId: form.id,
              ...parsedField,
            });
            await manager.save(field);
          }
        });

        console.log(
          `   ✅ Successfully migrated ${parsedFields.length} fields`,
        );
        migratedCount++;
      } catch (error) {
        console.error(`   ❌ Error migrating form ${form.id}:`, error);
        errorCount++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total forms: ${forms.length}`);
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!\n');
    } else {
      console.log('⚠️  Migration completed with some errors.\n');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('👋 Database connection closed\n');
    }
  }
}

// Run migration
migrateSchemaToFields()
  .then(() => {
    console.log('🏁 Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

