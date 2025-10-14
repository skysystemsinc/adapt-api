import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FormField } from './entities/form-field.entity';

interface ParsedField {
  fieldKey: string;
  label: string;
  type: string;
  options?: any;
  required: boolean;
  isSingle: boolean; // For checkbox: true = single (boolean), false = multiple options
  order: number;
  step: number;
  metadata?: any;
}

@Injectable()
export class FormFieldsService {
  private readonly logger = new Logger(FormFieldsService.name);

  constructor(
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
  ) {}

  /**
   * Sync fields from form schema JSON to form_fields table
   * Uses upsert strategy: updates existing fields, creates new ones, deletes removed ones
   * Preserves field IDs for existing fields (important for conditional logic)
   */
  async syncFieldsFromSchema(
    formId: string,
    schema: Record<string, any>,
  ): Promise<void> {
    this.logger.log(`🔄 Syncing fields for form ${formId}`);

    try {
      // Parse fields from incoming schema
      const parsedFields = this.parseFieldsFromSchema(schema);
      this.logger.log(`📋 Parsed ${parsedFields.length} fields from schema`);

      // Fetch existing fields from database
      const existingFields = await this.formFieldRepository.find({
        where: { formId },
      });
      this.logger.log(`📂 Found ${existingFields.length} existing fields in database`);

      // Create a map of existing fields by fieldKey for quick lookup
      const existingFieldsMap = new Map<string, FormField>();
      existingFields.forEach((field) => {
        existingFieldsMap.set(field.fieldKey, field);
      });

      // Track which fields we've processed
      const processedFieldKeys = new Set<string>();

      // Arrays for batch operations
      const fieldsToUpdate: FormField[] = [];
      const fieldsToCreate: FormField[] = [];

      // Process each incoming field
      for (const parsedField of parsedFields) {
        processedFieldKeys.add(parsedField.fieldKey);

        const existingField = existingFieldsMap.get(parsedField.fieldKey);

        if (existingField) {
          // Field exists - update it in place (preserves ID)
          existingField.label = parsedField.label;
          existingField.type = parsedField.type;
          existingField.options = parsedField.options;
          existingField.required = parsedField.required;
          existingField.isSingle = parsedField.isSingle;
          existingField.order = parsedField.order;
          existingField.step = parsedField.step;
          existingField.metadata = parsedField.metadata;

          fieldsToUpdate.push(existingField);
          this.logger.debug(
            `♻️  Updating existing field: ${parsedField.fieldKey} (ID: ${existingField.id})`,
          );
        } else {
          // Field doesn't exist - create new one
          const newField = this.formFieldRepository.create({
            formId,
            ...parsedField,
          });
          fieldsToCreate.push(newField);
          this.logger.debug(`✨ Creating new field: ${parsedField.fieldKey}`);
        }
      }

      // Find fields that need to be deleted (exist in DB but not in schema)
      const fieldKeysToDelete: string[] = [];
      existingFields.forEach((field) => {
        if (!processedFieldKeys.has(field.fieldKey)) {
          fieldKeysToDelete.push(field.fieldKey);
          this.logger.debug(`🗑️  Marking field for deletion: ${field.fieldKey}`);
        }
      });

      // Execute batch operations
      let updateCount = 0;
      let createCount = 0;
      let deleteCount = 0;

      // Update existing fields
      if (fieldsToUpdate.length > 0) {
        await this.formFieldRepository.save(fieldsToUpdate);
        updateCount = fieldsToUpdate.length;
        this.logger.log(`♻️  Updated ${updateCount} existing fields`);
      }

      // Create new fields
      if (fieldsToCreate.length > 0) {
        await this.formFieldRepository.save(fieldsToCreate);
        createCount = fieldsToCreate.length;
        this.logger.log(`✨ Created ${createCount} new fields`);
      }

      // Delete removed fields
      if (fieldKeysToDelete.length > 0) {
        await this.formFieldRepository.delete({
          formId,
          fieldKey: In(fieldKeysToDelete),
        });
        deleteCount = fieldKeysToDelete.length;
        this.logger.log(`🗑️  Deleted ${deleteCount} removed fields`);
      }

      this.logger.log(
        `✅ Sync complete: ${updateCount} updated, ${createCount} created, ${deleteCount} deleted`,
      );
    } catch (error) {
      this.logger.error(`❌ Error syncing fields for form ${formId}:`, error);
      throw error;
    }
  }

  /**
   * Parse fields from form schema JSON
   * Extracts fields from steps and assigns order/step numbers
   */
  private parseFieldsFromSchema(schema: Record<string, any>): ParsedField[] {
    const fields: ParsedField[] = [];
    let globalOrder = 0;

    if (!schema.steps || !Array.isArray(schema.steps)) {
      return fields;
    }

    schema.steps.forEach((step: any, stepIndex: number) => {
      if (!step.fields || !Array.isArray(step.fields)) {
        return;
      }

      step.fields.forEach((field: any, fieldIndex: number) => {
        // Skip heading fields (they don't have form values)
        if (field.type === 'heading') {
          return;
        }

        // Generate fieldKey if missing
        const fieldKey = field.id || this.generateFieldKey(globalOrder);

        // Determine if checkbox is single or multiple
        const isSingle = field.type === 'checkbox' && field.isSingle === true;

        // Extract field properties
        const parsedField: ParsedField = {
          fieldKey,
          label: field.label || '',
          type: field.type || 'text',
          options: isSingle ? null : (field.options || null), // Null options for single checkbox
          required: field.required || false,
          isSingle,
          order: globalOrder,
          step: stepIndex,
          metadata: {
            placeholder: field.placeholder,
            validation: field.validation,
            conditions: field.conditions,
          },
        };

        fields.push(parsedField);
        globalOrder++;
      });
    });

    return fields;
  }

  /**
   * Generate a unique field key
   */
  private generateFieldKey(index: number): string {
    return `field_${index + 1}`;
  }

  /**
   * Get all fields for a form
   */
  async getFieldsByFormId(formId: string): Promise<FormField[]> {
    return this.formFieldRepository.find({
      where: { formId },
      order: { step: 'ASC', order: 'ASC' },
    });
  }

  /**
   * Get a specific field by form ID and field key
   */
  async getFieldByKey(formId: string, fieldKey: string): Promise<FormField | null> {
    return this.formFieldRepository.findOne({
      where: { formId, fieldKey },
    });
  }

  /**
   * Delete all fields for a form
   * Called when a form is deleted (cascade will handle this too)
   */
  async deleteFieldsByFormId(formId: string): Promise<void> {
    await this.formFieldRepository.delete({ formId });
    this.logger.log(`Deleted fields for form ${formId}`);
  }
}

