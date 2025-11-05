import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Form, FormStatus } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormResponseDto } from './dto/form-response.dto';
import { FormFieldResponseDto } from './dto/form-field-response.dto';
import { FormStepResponseDto } from './dto/form-step-response.dto';
import { FormFieldsService } from './form-fields.service';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    private readonly formFieldsService: FormFieldsService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Create a new form
   * @deprecated Schema column is deprecated. Use form_fields table via FormFieldsController instead.
   */
  async create(createFormDto: CreateFormDto): Promise<FormResponseDto> {
    // Deprecation warning
    if (createFormDto.schema) {
      console.warn(
        '⚠️  DEPRECATED: Creating form with schema column. Please use form_fields table instead.',
      );
    }

    // Get all existing slugs from database
    const existingForms = await this.formRepository.find({
      select: ['slug'],
    });
    const existingSlugs = existingForms.map(form => form.slug);

    // Auto-generate unique slug from title
    const newSlug = this.generateSlug(createFormDto.title, existingSlugs);

    // Check if this is a registration form
    const isRegistrationForm = newSlug === 'registration-form';

    // Create form with defaults
    const form = this.formRepository.create({
      title: createFormDto.title,
      description: createFormDto.description,
      slug: newSlug,
      schema: createFormDto.schema, // DEPRECATED: kept for backward compatibility
      isPublic: true, // Default value
      status: 'published' as any, // Default value
      version: isRegistrationForm ? 'v1' : undefined,
      isActive: true, // All new forms are active by default
    });

    // Save to database
    const savedForm = await this.formRepository.save(form);

    // Sync fields to form_fields table (deprecated path)
    if (createFormDto.schema) {
      try {
        await this.formFieldsService.syncFieldsFromSchema(
          savedForm.id,
          savedForm.schema,
        );
      } catch (error) {
        console.error('❌ Failed to sync form fields:', error);
        // Don't throw - form was created successfully, field sync is supplementary
      }
    }

    // Return formatted response
    return plainToInstance(FormResponseDto, savedForm, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all forms
   * Returns forms with fields from form_fields table (not schema column)
   * Only returns:
   * - Forms with isActive = true
   * - Forms with status = 'published'
   * - For registration forms, only the latest (active) version
   */
  async findAll(): Promise<FormResponseDto[]> {
    // Query with filters: isActive = true, status = 'published'
    const forms = await this.formRepository.find({
      where: {
        isActive: true,
        status: FormStatus.PUBLISHED,
      },
      order: { createdAt: 'DESC' },
    });

    // Transform to DTOs and add fields from form_fields table
    const formDtos = await Promise.all(
      forms.map(async (form) => {
        const dto = plainToInstance(FormResponseDto, form, {
          excludeExtraneousValues: true,
        });
        // Get fields from form_fields table, grouped by step
        dto.steps = await this.getFieldsGroupedByStep(form.id);
        return dto;
      }),
    );

    return formDtos;
  }

  /**
   * Get a single form by ID
   * Returns form with fields from form_fields table (not schema column)
   * Only returns forms with isActive = true and status = 'published'
   * For registration forms, if accessing an old version, returns the latest (active) version instead
   */
  async findOne(id: string): Promise<FormResponseDto> {
    const form = await this.formRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Form with ID '${id}' not found`);
    }

    // If this is an old version of a registration form, return the latest version instead
    if (form.slug === 'registration-form' && !form.isActive) {
      const activeForm = await this.formRepository.findOne({
        where: { 
          slug: 'registration-form', 
          isActive: true,
          status: FormStatus.PUBLISHED,
        },
      });

      if (activeForm) {
        // Return the active version instead
        const dto = plainToInstance(FormResponseDto, activeForm, {
          excludeExtraneousValues: true,
        });
        dto.steps = await this.getFieldsGroupedByStep(activeForm.id);
        return dto;
      }
    }

    // Check if form is active and published
    if (!form.isActive || form.status !== FormStatus.PUBLISHED) {
      throw new NotFoundException(
        `Form with ID '${id}' is not available (not active or not published)`,
      );
    }

    const dto = plainToInstance(FormResponseDto, form, {
      excludeExtraneousValues: true,
    });

    // Get fields from form_fields table, grouped by step
    dto.steps = await this.getFieldsGroupedByStep(id);

    return dto;
  }

  /**
   * Get a form by slug (public access)
   * Returns form with fields from form_fields table (not schema column)
   * Only returns forms with isActive = true, status = 'published', and isPublic = true
   * For registration-form, only returns the active version
   */
  async findBySlug(slug: string): Promise<FormResponseDto> {
    // For registration-form, only return active version
    const where: any = { 
      slug, 
      isPublic: true,
      isActive: true,
      status: FormStatus.PUBLISHED,
    };

    const form = await this.formRepository.findOne({
      where,
    });

    if (!form) {
      throw new NotFoundException(`Public form with slug '${slug}' not found`);
    }

    const dto = plainToInstance(FormResponseDto, form, {
      excludeExtraneousValues: true,
    });

    // Get fields from form_fields table, grouped by step
    dto.steps = await this.getFieldsGroupedByStep(form.id);

    return dto;
  }

  /**
   * Update a form
   * @deprecated Schema column is deprecated. Use form_fields table via FormFieldsController instead.
   * 
   * For registration forms (slug = "registration-form"), this implements versioning:
   * - Old form becomes inactive (isActive = false) and slug changes to "registration-form-v{version}"
   * - New form is created with isActive = true and slug = "registration-form"
   */
  async update(
    id: string,
    updateFormDto: UpdateFormDto,
  ): Promise<FormResponseDto> {
    // Deprecation warning
    if (updateFormDto.schema !== undefined) {
      console.warn(
        '⚠️  DEPRECATED: Updating form with schema column. Please use form_fields table instead.',
      );
    }

    // Check if form exists
    const form = await this.formRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Form with ID '${id}' not found`);
    }

    // Check if this is a registration form update
    const isRegistrationForm = form.slug === 'registration-form' && form.isActive;

    if (isRegistrationForm) {
      // Handle versioning for registration forms
      return await this.updateRegistrationFormWithVersioning(
        form,
        updateFormDto,
      );
    }

    // Regular form update (non-registration form or inactive registration form)
    // If title is being updated, regenerate slug
    if (updateFormDto.title && updateFormDto.title !== form.title) {
      // Get all existing slugs from database (excluding current form)
      const existingForms = await this.formRepository.find({
        select: ['slug'],
        where: { id: Not(id) }, // Exclude current form
      });
      const existingSlugs = existingForms.map(form => form.slug);

      // Auto-generate unique slug from title
      const newSlug = this.generateSlug(updateFormDto.title, existingSlugs);

      form.slug = newSlug;
    }

    // Update fields
    if (updateFormDto.title !== undefined) {
      form.title = updateFormDto.title;
    }
    if (updateFormDto.description !== undefined) {
      form.description = updateFormDto.description;
    }
    if (updateFormDto.schema !== undefined) {
      form.schema = updateFormDto.schema; // DEPRECATED: kept for backward compatibility
    }

    // Save updated form
    const updatedForm = await this.formRepository.save(form);

    // Sync fields to form_fields table (deprecated path)
    if (updateFormDto.schema !== undefined) {
      try {
        await this.formFieldsService.syncFieldsFromSchema(
          updatedForm.id,
          updatedForm.schema,
        );
      } catch (error) {
        console.error('❌ Failed to sync form fields:', error);
        // Don't throw - form was updated successfully, field sync is supplementary
      }
    }

    return plainToInstance(FormResponseDto, updatedForm, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Ensure registration form versioning before field operations
   * Returns the form ID to use (may be new if versioning was triggered)
   * This method is idempotent - if versioning already happened, it returns the active form
   */
  async ensureRegistrationFormVersioning(formId: string): Promise<string> {
    const form = await this.formRepository.findOne({ where: { id: formId } });

    if (!form) {
      throw new NotFoundException(`Form with ID '${formId}' not found`);
    }

    // Check if this is an active registration form
    const isRegistrationForm = form.slug === 'registration-form' && form.isActive;

    if (!isRegistrationForm) {
      // Not a registration form - check if it's an inactive registration form
      // If so, find the active version
      if (form.slug === 'registration-form' && !form.isActive) {
        // Find the active registration form
        const activeForm = await this.formRepository.findOne({
          where: { slug: 'registration-form', isActive: true },
        });
        if (activeForm) {
          return activeForm.id;
        }
      }
      // Not a registration form, return original ID
      return formId;
    }

    // Registration form is active - create new version
    const newForm = await this.createNewRegistrationFormVersion(form);
    return newForm.id;
  }

  /**
   * Create a new version of a registration form
   * Returns the new form
   */
  private async createNewRegistrationFormVersion(oldForm: Form): Promise<Form> {
    return await this.dataSource.transaction(async (manager) => {
      // Get current version number
      const currentVersion = oldForm.version || 'v1';
      const versionNumber = parseInt(currentVersion.replace('v', '')) || 1;
      const nextVersion = `v${versionNumber + 1}`;

      // Update old form: set isActive = false and change slug
      oldForm.isActive = false;
      oldForm.slug = `registration-form-${currentVersion}`;
      await manager.save(oldForm);

      // Get old form fields to copy
      const oldFormFields = await manager.find(FormField, {
        where: { formId: oldForm.id },
      });

      // Create new form
      const newForm = manager.create(Form, {
        title: oldForm.title,
        description: oldForm.description,
        slug: 'registration-form',
        schema: oldForm.schema,
        isPublic: oldForm.isPublic,
        status: oldForm.status,
        createdBy: oldForm.createdBy,
        version: nextVersion,
        isActive: true,
      });

      const savedNewForm = await manager.save(newForm);

      // Copy form fields from old form to new form
      if (oldFormFields.length > 0) {
        const newFormFields = oldFormFields.map((field) => {
          const { id, formId, createdAt, updatedAt, ...fieldData } = field;
          return manager.create(FormField, {
            ...fieldData,
            formId: savedNewForm.id,
          });
        });
        await manager.save(newFormFields);
      }

      return savedNewForm;
    });
  }

  /**
   * Update registration form with versioning logic
   * - Old form: isActive = false, slug = "registration-form-v{version}"
   * - New form: isActive = true, slug = "registration-form", version = next version
   */
  private async updateRegistrationFormWithVersioning(
    oldForm: Form,
    updateFormDto: UpdateFormDto,
  ): Promise<FormResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      // Get current version number
      const currentVersion = oldForm.version || 'v1';
      const versionNumber = parseInt(currentVersion.replace('v', '')) || 1;
      const nextVersion = `v${versionNumber + 1}`;

      // Update old form: set isActive = false and change slug
      oldForm.isActive = false;
      oldForm.slug = `registration-form-${currentVersion}`;
      await manager.save(oldForm);

      // Get old form fields to copy
      const oldFormFields = await manager.find(FormField, {
        where: { formId: oldForm.id },
      });

      // Create new form with updated data
      const newForm = manager.create(Form, {
        title: updateFormDto.title !== undefined ? updateFormDto.title : oldForm.title,
        description: updateFormDto.description !== undefined ? updateFormDto.description : oldForm.description,
        slug: 'registration-form',
        schema: updateFormDto.schema !== undefined ? updateFormDto.schema : oldForm.schema,
        isPublic: oldForm.isPublic,
        status: oldForm.status,
        createdBy: oldForm.createdBy,
        version: nextVersion,
        isActive: true,
      });

      const savedNewForm = await manager.save(newForm);

      // Copy form fields from old form to new form
      if (oldFormFields.length > 0) {
        const newFormFields = oldFormFields.map((field) => {
          const { id, formId, createdAt, updatedAt, ...fieldData } = field;
          return manager.create(FormField, {
            ...fieldData,
            formId: savedNewForm.id,
          });
        });
        await manager.save(newFormFields);
      }

      // If schema was updated, sync fields (this will update the copied fields)
      if (updateFormDto.schema !== undefined) {
        try {
          await this.formFieldsService.syncFieldsFromSchema(
            savedNewForm.id,
            updateFormDto.schema,
          );
        } catch (error) {
          console.error('❌ Failed to sync form fields:', error);
          // Don't throw - form was updated successfully, field sync is supplementary
        }
      }

      // Return formatted response with fields
      const dto = plainToInstance(FormResponseDto, savedNewForm, {
        excludeExtraneousValues: true,
      });
      dto.steps = await this.getFieldsGroupedByStep(savedNewForm.id);

      return dto;
    });
  }

  /**
   * Delete a form
   */
  async remove(id: string): Promise<{ message: string }> {
    const form = await this.formRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Form with ID '${id}' not found`);
    }

    await this.formRepository.remove(form);

    return { message: `Form with ID '${id}' has been deleted successfully` };
  }

  /**
   * Get fields from form_fields table grouped by step
   */
  private async getFieldsGroupedByStep(
    formId: string,
  ): Promise<FormStepResponseDto[]> {
    // Fetch all fields for this form from form_fields table
    const fields = await this.formFieldsService.getFieldsByFormId(formId);

    // Group fields by step number
    const fieldsByStep = new Map<number, FormFieldResponseDto[]>();

    for (const field of fields) {
      const fieldDto = plainToInstance(FormFieldResponseDto, field, {
        excludeExtraneousValues: true,
      });

      if (!fieldsByStep.has(field.step)) {
        fieldsByStep.set(field.step, []);
      }
      fieldsByStep.get(field.step)!.push(fieldDto);
    }

    // Convert Map to array of FormStepResponseDto
    const steps: FormStepResponseDto[] = [];
    fieldsByStep.forEach((fields, stepNumber) => {
      steps.push({
        stepNumber,
        fields: fields.sort((a, b) => a.order - b.order), // Sort by order within step
      });
    });

    // Sort steps by step number
    return steps.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  /**
   * Generate URL-friendly slug from title
   * Remove special characters and replace spaces with hyphens
   * Keep only lowercase letters, numbers, and hyphens
   * Remove leading and trailing hyphens
   * If slug already exists, add a counter to the end
   */
  private generateSlug(title: string, existingSlugs: string[]): string {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!existingSlugs.includes(slug)) {
      return slug;
    }

    let counter = 1;
    let newSlug = `${slug}`;
    if(existingSlugs.includes(newSlug)) {
      while (existingSlugs.includes(newSlug)) {
        newSlug = `${slug}-${counter}`;
        counter++;
      }
    }

    return newSlug;
  }
}

