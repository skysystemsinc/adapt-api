import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FormsService } from '../modules/forms/forms.service';
import { FormFieldsService } from '../modules/forms/form-fields.service';

/**
 * One-time script to sync existing forms to form_fields table
 * Run with: npm run start:dev -- --sync-fields
 */
async function syncExistingForms() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const formsService = app.get(FormsService);
  const formFieldsService = app.get(FormFieldsService);

  try {
    console.log('🔄 Syncing existing forms to form_fields table...');

    // Get all forms
    const forms = await formsService.findAll();
    console.log(`Found ${forms.length} forms`);

    // Sync each form
    for (const form of forms) {
      console.log(`\n📝 Syncing form: ${form.title} (${form.id})`);
      
      try {
        await formFieldsService.syncFieldsFromSchema(form.id, form.schema);
        console.log(`✅ Successfully synced fields for "${form.title}"`);
      } catch (error) {
        console.error(`❌ Failed to sync "${form.title}":`, error.message);
      }
    }

    console.log('\n✨ Sync complete!');
  } catch (error) {
    console.error('Error syncing forms:', error);
  } finally {
    await app.close();
  }
}

syncExistingForms();

