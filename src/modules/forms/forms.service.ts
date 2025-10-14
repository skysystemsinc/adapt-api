import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Form } from './entities/form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormResponseDto } from './dto/form-response.dto';
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
    // Auto-generate slug from title
    const baseSlug = this.generateSlug(createFormDto.title, []);
    const newSlug = this.generateSlug(createFormDto.title, [baseSlug]);

    // Check if slug already exists
    const existingForm = await this.formRepository.findOne({
      where: { slug: newSlug },
    });
    if (existingForm) {
      throw new ConflictException(
        `Form with slug '${newSlug}' already exists`,
      );
    }

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

    return plainToInstance(FormResponseDto, forms, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get a single form by ID
   */
  async findOne(id: string): Promise<FormResponseDto> {
    const form = await this.formRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException(`Form with ID '${id}' not found`);
    }

    return plainToInstance(FormResponseDto, form, {
      excludeExtraneousValues: true,
    });
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

    return plainToInstance(FormResponseDto, form, {
      excludeExtraneousValues: true,
    });
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
      const baseSlug = this.generateSlug(updateFormDto.title, []);
      const newSlug = this.generateSlug(updateFormDto.title, [baseSlug]);

      // Check if new slug conflicts with another form
      if (newSlug !== form.slug) {
        const existingForm = await this.formRepository.findOne({
          where: { slug: newSlug },
        });
        if (existingForm) {
          throw new ConflictException(
            `Form with slug '${newSlug}' already exists`,
          );
        }
        form.slug = newSlug;
      }
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
    let newSlug = `${slug}-${counter}`;
    while (existingSlugs.includes(newSlug)) {
      counter++;
      newSlug = `${slug}-${counter}`;
    }

    return newSlug;
  }
}

