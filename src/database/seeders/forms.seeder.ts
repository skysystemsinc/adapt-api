import { DataSource } from 'typeorm';
import { Form } from '../../modules/forms/entities/form.entity';
import { FormField } from '../../modules/forms/entities/form-field.entity';
import * as fs from 'fs';
import * as path from 'path';

export class FormsSeeder {
  private readonly dataFilePath = path.join(__dirname, 'forms-data.json');

  public async run(dataSource: DataSource): Promise<void> {
    const formsRepository = dataSource.getRepository(Form);
    const formFieldsRepository = dataSource.getRepository(FormField);

    console.log('🌱 Seeding forms and form fields...\n');

    // Check if forms-data.json exists
    if (!fs.existsSync(this.dataFilePath)) {
      console.log('⚠️  No forms data file found. Run "npm run export:forms" first to generate the data.\n');
      return;
    }

    // Read data from JSON file
    const fileContent = fs.readFileSync(this.dataFilePath, 'utf-8');
    const { forms: formsData, formFields: formFieldsData } = JSON.parse(fileContent);

    if (!formsData || formsData.length === 0) {
      console.log('⚠️  No forms data found in forms-data.json\n');
      return;
    }

    console.log(`Found ${formsData.length} forms and ${formFieldsData.length} form fields to seed\n`);

    // Seed forms
    for (const formData of formsData) {
      const exists = await formsRepository.findOne({
        where: { slug: formData.slug },
      });

      if (!exists) {
        const form = formsRepository.create(formData);
        await formsRepository.save(form);
        console.log(`✓ Created form: ${formData.title} (${formData.slug})`);
      } else {
        console.log(`- Form already exists: ${formData.title} (${formData.slug})`);
      }
    }

    // Seed form fields
    for (const fieldData of formFieldsData) {
      const exists = await formFieldsRepository.findOne({
        where: {
          formId: fieldData.formId,
          fieldKey: fieldData.fieldKey,
        },
      });

      if (!exists) {
        const formField = formFieldsRepository.create(fieldData);
        await formFieldsRepository.save(formField);
        console.log(`✓ Created form field: ${fieldData.fieldKey} for form ${fieldData.formId}`);
      } else {
        console.log(`- Form field already exists: ${fieldData.fieldKey} for form ${fieldData.formId}`);
      }
    }

    console.log('\n✅ Forms and form fields seeding completed\n');
  }

  /**
   * Export existing forms and form fields from database to JSON file
   */
  public async export(dataSource: DataSource): Promise<void> {
    const formsRepository = dataSource.getRepository(Form);
    const formFieldsRepository = dataSource.getRepository(FormField);

    console.log('📦 Exporting forms and form fields from database...\n');

    // Fetch all forms
    const forms = await formsRepository.find({
      where: { slug: 'registration-form' },
    });

    if(!forms || forms.length === 0) {
      console.error('No registration form found');
      return;
    }
    // Fetch all form fields
    const formFields = await formFieldsRepository.find({
      where: { formId: forms[0].id },
    });

    console.log(`Found ${formFields.length} form fields for form ${forms[0].id}\n`);

    // Prepare forms data (exclude auto-generated fields)
    const formsData = forms.map((form) => ({
      id: form.id,
      title: form.title,
      slug: form.slug,
      description: form.description,
      schema: form.schema,
      isPublic: form.isPublic,
      status: form.status,
      createdBy: form.createdBy,
      version: form.version,
      isActive: form.isActive,
    }));

    // Prepare form fields data (exclude auto-generated fields)
    const formFieldsData = formFields.map((field) => ({
      id: field.id,
      formId: field.formId,
      fieldKey: field.fieldKey,
      label: field.label,
      title: field.title,
      type: field.type,
      options: field.options,
      required: field.required,
      isSingle: field.isSingle,
      placeholder: field.placeholder,
      validation: field.validation,
      conditions: field.conditions,
      order: field.order,
      step: field.step,
      metadata: field.metadata,
      width: field.width,
      includeInKycVerification: field.includeInKycVerification,
      documentTypeId: field.documentTypeId,
    }));

    // Write to JSON file
    const data = {
      forms: formsData,
      formFields: formFieldsData,
      exportedAt: new Date().toISOString(),
    };

    fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ Export completed!\n');
    console.log(`📝 Data saved to: ${this.dataFilePath}\n`);
    console.log('ℹ️  Now you can run "npm run seed" to import this data into a database.\n');
  }
}

