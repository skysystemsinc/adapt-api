import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { FormField } from './entities/form-field.entity';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FieldOrderDto } from './dto/reorder-fields.dto';
import { FormsService } from './forms.service';

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
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => FormsService))
    private readonly formsService: FormsService,
  ) { }

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

  /**
   * Create a new field
   * For registration forms, triggers versioning before creating the field
   */
  async createField(
    formId: string,
    createFieldDto: CreateFieldDto,
  ): Promise<FormField> {
    // Ensure versioning for registration forms before creating field
    const actualFormId = await this.formsService.ensureRegistrationFormVersioning(
      formId,
    );

    // Check for duplicate fieldKey
    const existing = await this.formFieldRepository.findOne({
      where: { formId: actualFormId, fieldKey: createFieldDto.fieldKey },
    });

    if (existing) {
      throw new BadRequestException(
        `Field with key '${createFieldDto.fieldKey}' already exists in this form`,
      );
    }

    const field = this.formFieldRepository.create({
      formId: actualFormId,
      ...createFieldDto,
    });

    const savedField = await this.formFieldRepository.save(field);
    this.logger.log(`Created field ${savedField.id} (${savedField.fieldKey})`);

    return savedField;
  }

  /**
   * Update a field
   * For registration forms, triggers versioning before updating the field
   */
  async updateField(
    fieldId: string,
    updateFieldDto: UpdateFieldDto,
  ): Promise<FormField> {
    const field = await this.formFieldRepository.findOne({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID '${fieldId}' not found`);
    }

    // Ensure versioning for registration forms before updating field
    const actualFormId = await this.formsService.ensureRegistrationFormVersioning(
      field.formId,
    );

    // If form ID changed due to versioning, update the field's formId
    if (actualFormId !== field.formId) {
      // Find the corresponding field in the new form version
      const newFormField = await this.formFieldRepository.findOne({
        where: {
          formId: actualFormId,
          fieldKey: field.fieldKey,
        },
      });

      if (!newFormField) {
        throw new NotFoundException(
          `Field not found in new form version. Please try again.`,
        );
      }

      // Update the field in the new form version
      if (updateFieldDto.fieldKey && updateFieldDto.fieldKey !== newFormField.fieldKey) {
        const existing = await this.formFieldRepository.findOne({
          where: {
            formId: actualFormId,
            fieldKey: updateFieldDto.fieldKey,
          },
        });

        if (existing) {
          throw new BadRequestException(
            `Field with key '${updateFieldDto.fieldKey}' already exists in this form`,
          );
        }
      }

      Object.assign(newFormField, updateFieldDto);
      const updatedField = await this.formFieldRepository.save(newFormField);
      this.logger.log(`Updated field ${fieldId} (${newFormField.fieldKey}) in new form version`);

      return updatedField;
    }

    // If updating fieldKey, check for duplicates
    if (updateFieldDto.fieldKey && updateFieldDto.fieldKey !== field.fieldKey) {
      const existing = await this.formFieldRepository.findOne({
        where: {
          formId: field.formId,
          fieldKey: updateFieldDto.fieldKey,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Field with key '${updateFieldDto.fieldKey}' already exists in this form`,
        );
      }
    }

    // Apply updates
    Object.assign(field, updateFieldDto);

    const updatedField = await this.formFieldRepository.save(field);
    this.logger.log(`Updated field ${fieldId} (${field.fieldKey})`);

    return updatedField;
  }

  /**
   * Delete a field
   * For registration forms, triggers versioning before deleting the field
   */
  async deleteField(fieldId: string): Promise<{ message: string }> {
    const field = await this.formFieldRepository.findOne({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID '${fieldId}' not found`);
    }

    // Ensure versioning for registration forms before deleting field
    const actualFormId = await this.formsService.ensureRegistrationFormVersioning(
      field.formId,
    );

    // If form ID changed due to versioning, find the field in the new form
    if (actualFormId !== field.formId) {
      const newFormField = await this.formFieldRepository.findOne({
        where: {
          formId: actualFormId,
          fieldKey: field.fieldKey,
        },
      });

      if (newFormField) {
        await this.formFieldRepository.remove(newFormField);
        this.logger.log(`Deleted field ${fieldId} (${field.fieldKey}) from new form version`);
      }
    } else {
      await this.formFieldRepository.remove(field);
      this.logger.log(`Deleted field ${fieldId} (${field.fieldKey})`);
    }

    return {
      message: `Field with ID '${fieldId}' has been deleted successfully`,
    };
  }

  /**
   * Reorder fields (TRANSACTIONAL - all or nothing)
   * Updates order and step for multiple fields atomically using bulk updates
   * For registration forms, triggers versioning before reordering
   */
  async reorderFields(
    formId: string,
    fieldOrders: FieldOrderDto[],
  ): Promise<{ message: string }> {
    if (!fieldOrders || fieldOrders.length === 0) {
      throw new BadRequestException('fieldOrders array cannot be empty');
    }

    // Ensure versioning for registration forms before reordering
    const actualFormId = await this.formsService.ensureRegistrationFormVersioning(
      formId,
    );

    // If form ID changed, we need to map old field IDs to new field IDs
    let mappedFieldOrders = fieldOrders;
    if (actualFormId !== formId) {
      // Get old fields to map by fieldKey
      const oldFields = await this.formFieldRepository.find({
        where: { formId },
        select: ['id', 'fieldKey'],
      });

      // Get new fields
      const newFields = await this.formFieldRepository.find({
        where: { formId: actualFormId },
        select: ['id', 'fieldKey'],
      });

      // Create mapping from old field ID to new field ID via fieldKey
      const oldFieldMap = new Map(oldFields.map(f => [f.id, f.fieldKey]));
      const newFieldMap = new Map(newFields.map(f => [f.fieldKey, f.id]));

      mappedFieldOrders = fieldOrders.map(order => {
        const fieldKey = oldFieldMap.get(order.id);
        const newFieldId = fieldKey ? newFieldMap.get(fieldKey) : null;
        return {
          id: newFieldId || order.id,
          order: order.order,
          step: order.step,
        };
      }).filter(order => order.id !== null) as FieldOrderDto[];
    }

    // Use a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get all field IDs from the request
      const fieldIds = mappedFieldOrders.map((f) => f.id);
      const uniqueFieldIds = [...new Set(fieldIds)];

      // Check for duplicate IDs in the request
      if (uniqueFieldIds.length !== fieldIds.length) {
        throw new BadRequestException(
          'Duplicate field IDs found in reorder request',
        );
      }

      // Fetch all fields to verify they belong to this form
      const fields = await queryRunner.manager.find(FormField, {
        where: { formId: actualFormId, id: In(uniqueFieldIds) },
      });

      if (fields.length !== uniqueFieldIds.length) {
        throw new BadRequestException(
          `Some field IDs do not belong to form ${actualFormId}`,
        );
      }

      // Use Promise.all for parallel updates (more efficient than sequential loop)
      await Promise.all(
        mappedFieldOrders.map((fieldOrder) =>
          queryRunner.manager.update(
            FormField,
            { id: fieldOrder.id, formId: actualFormId },
            {
              order: fieldOrder.order,
              step: fieldOrder.step,
            },
          ),
        ),
      );

      await queryRunner.commitTransaction();
      this.logger.log(
        `Reordered ${mappedFieldOrders.length} fields for form ${actualFormId}`,
      );

      return { message: 'Fields reordered successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to reorder fields for form ${formId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete all fields in a specific step (TRANSACTIONAL - all or nothing)
   */
  async deleteFieldsByStep(
    formId: string,
    stepNumber: number,
  ): Promise<{ message: string }> {
    // Use a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.delete(FormField, {
        formId,
        step: stepNumber,
      });

      await queryRunner.commitTransaction();
      this.logger.log(
        `Deleted ${result.affected || 0} fields from step ${stepNumber} of form ${formId}`,
      );

      return {
        message: `${result.affected || 0} field(s) deleted from step ${stepNumber}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete fields from step ${stepNumber} of form ${formId}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

