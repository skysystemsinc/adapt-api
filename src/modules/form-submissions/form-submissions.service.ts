import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { FormSubmission, SubmissionStatus } from './entities/form-submission.entity';
import { FormSubmissionValue } from './entities/form-submission-value.entity';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/form-field.entity';
import { SubmitFormDto } from './dto/submit-form.dto';
import { FormSubmissionResponseDto } from './dto/form-submission-response.dto';

@Injectable()
export class FormSubmissionsService {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly submissionRepository: Repository<FormSubmission>,
    @InjectRepository(FormSubmissionValue)
    private readonly submissionValueRepository: Repository<FormSubmissionValue>,
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
  ) {}

  /**
   * Submit a form by formId
   * Validates that submitted fields exist in the form_fields table
   */
  async submitForm(
    submitFormDto: SubmitFormDto,
  ): Promise<FormSubmissionResponseDto> {
    // Find the form by ID
    const form = await this.formRepository.findOne({
      where: { id: submitFormDto.formId },
    });

    if (!form) {
      throw new NotFoundException(
        `Form with ID '${submitFormDto.formId}' not found`,
      );
    }

    // Check if this is a registration form
    if (form.slug.endsWith('-registration-form')) {
      throw new BadRequestException(
        'Registration forms should be submitted to /registration-applications endpoint',
      );
    }

    // Validate submitted fields against form_fields table (schema is deprecated)
    await this.validateSubmittedFields(form.id, submitFormDto.values);

    // Create submission
    const submission = this.submissionRepository.create({
      formId: form.id,
      userId: submitFormDto.userId || null,
      status: submitFormDto.status || SubmissionStatus.SUBMITTED,
      meta: submitFormDto.meta || null,
      submittedAt: new Date(),
    });

    // Save submission
    const savedSubmission = await this.submissionRepository.save(submission);

    // Create submission values from array
    const submissionValues = submitFormDto.values.map((fieldValue) => {
      return this.submissionValueRepository.create({
        submissionId: savedSubmission.id,
        fieldKey: fieldValue.fieldKey,
        value: this.serializeValue(fieldValue.value),
        label: fieldValue.label || null,
      });
    });

    // Save all values
    if (submissionValues.length > 0) {
      await this.submissionValueRepository.save(submissionValues);
    }

    // Fetch complete submission with values
    const completeSubmission = await this.submissionRepository.findOne({
      where: { id: savedSubmission.id },
      relations: ['values'],
    });

    if (!completeSubmission) {
      throw new NotFoundException('Submission not found after creation');
    }

    // Return formatted response
    return plainToInstance(FormSubmissionResponseDto, completeSubmission, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get a submission by ID
   */
  async findOne(id: string): Promise<FormSubmissionResponseDto> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID '${id}' not found`);
    }

    return plainToInstance(FormSubmissionResponseDto, submission, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get all submissions for a form (by slug)
   */
  async findByFormSlug(slug: string): Promise<FormSubmissionResponseDto[]> {
    const form = await this.formRepository.findOne({
      where: { slug },
    });

    if (!form) {
      throw new NotFoundException(`Form with slug '${slug}' not found`);
    }

    const submissions = await this.submissionRepository.find({
      where: { formId: form.id },
      relations: ['values'],
      order: { submittedAt: 'DESC' },
    });

    return plainToInstance(FormSubmissionResponseDto, submissions, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Validate that all submitted fields exist in the form_fields table
   */
  private async validateSubmittedFields(
    formId: string,
    values: Array<{ fieldKey: string; value: any }>,
  ): Promise<void> {
    // Get all valid fieldKeys from form_fields table
    const formFields = await this.formFieldRepository.find({
      where: { formId },
      select: ['fieldKey', 'type'],
    });

    // Create a set of valid fieldKeys (exclude heading fields)
    const validFieldKeys = new Set<string>();
    formFields.forEach((field) => {
      if (field.type !== 'heading') {
        validFieldKeys.add(field.fieldKey);
      }
    });

    // Check each submitted field
    const invalidFields: string[] = [];
    values.forEach((fieldValue) => {
      if (!validFieldKeys.has(fieldValue.fieldKey)) {
        invalidFields.push(fieldValue.fieldKey);
      }
    });

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Field '${invalidFields[0]}' not found in form`,
      );
    }
  }

  /**
   * Serialize value to string for storage
   * Handles arrays, objects, primitives
   */
  private serializeValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
}

