import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Form } from './entities/form.entity';
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
  ) { }

  /**
   * Create a new form
   */
  async create(createFormDto: CreateFormDto): Promise<FormResponseDto> {
    // Get all existing slugs from database
    const existingForms = await this.formRepository.find({
      select: ['slug'],
    });
    const existingSlugs = existingForms.map(form => form.slug);

    // Auto-generate unique slug from title
    const newSlug = this.generateSlug(createFormDto.title, existingSlugs);

    // Create form with defaults
    const form = this.formRepository.create({
      title: createFormDto.title,
      description: createFormDto.description,
      slug: newSlug,
      schema: createFormDto.schema, // Store frontend JSON exactly as-is
      isPublic: true, // Default value
      status: 'published' as any, // Default value
    });

    // Save to database
    const savedForm = await this.formRepository.save(form);

    // Sync fields to form_fields table
    try {
      await this.formFieldsService.syncFieldsFromSchema(
        savedForm.id,
        savedForm.schema,
      );
    } catch (error) {
      console.error('❌ Failed to sync form fields:', error);
      // Don't throw - form was created successfully, field sync is supplementary
    }

    // Return formatted response
    return plainToInstance(FormResponseDto, savedForm, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all forms
   */
  async findAll(): Promise<FormResponseDto[]> {
    const forms = await this.formRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Transform to DTOs and add fields from form_fields table
    const formDtos = await Promise.all(
      forms.map(async (form) => {
        const dto = plainToInstance(FormResponseDto, form, {
          excludeExtraneousValues: true,
        });
        dto.steps = await this.getFieldsGroupedByStep(form.id);
        return dto;
      }),
    );

    return formDtos;
  }

  /**
   * Get a single form by ID
   */
  async findOne(id: string): Promise<FormResponseDto> {
    const form = await this.formRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Form with ID '${id}' not found`);
    }

    const dto = plainToInstance(FormResponseDto, form, {
      excludeExtraneousValues: true,
    });

    // Add fields grouped by step from form_fields table
    dto.steps = await this.getFieldsGroupedByStep(id);

    return dto;
  }

  /**
   * Get a form by slug (public access)
   */
  async findBySlug(slug: string): Promise<FormResponseDto> {
    const form = await this.formRepository.findOne({
      where: { slug, isPublic: true },
    });

    if (!form) {
      throw new NotFoundException(`Public form with slug '${slug}' not found`);
    }

    const dto = plainToInstance(FormResponseDto, form, {
      excludeExtraneousValues: true,
    });

    // Add fields grouped by step from form_fields table
    dto.steps = await this.getFieldsGroupedByStep(form.id);

    return dto;
  }

  /**
   * Update a form
   */
  async update(
    id: string,
    updateFormDto: UpdateFormDto,
  ): Promise<FormResponseDto> {
    // Check if form exists
    const form = await this.formRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Form with ID '${id}' not found`);
    }

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
      form.schema = updateFormDto.schema;
    }

    // Save updated form
    const updatedForm = await this.formRepository.save(form);

    // Sync fields to form_fields table (if schema was updated)
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

