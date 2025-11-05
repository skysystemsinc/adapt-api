import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { FormRequest, FormRequestStatus } from './entities/form-request.entity';
import { FormFieldRequest, FieldAction } from './entities/form-field-request.entity';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { ReviewFormRequestDto } from './dto/review-form-request.dto';
import { FormRequestResponseDto, FormFieldRequestResponseDto } from './dto/form-request-response.dto';
import { Form } from '../forms/entities/form.entity';
import { FormField } from '../forms/entities/form-field.entity';

@Injectable()
export class FormRequestsService {
  constructor(
    @InjectRepository(FormRequest)
    private readonly formRequestRepository: Repository<FormRequest>,
    @InjectRepository(FormFieldRequest)
    private readonly formFieldRequestRepository: Repository<FormFieldRequest>,
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a form request for approval
   */
  async create(
    createFormRequestDto: CreateFormRequestDto,
    requestedBy?: string,
  ): Promise<FormRequestResponseDto> {
    // Verify the form exists
    const form = await this.formRepository.findOne({
      where: { id: createFormRequestDto.formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID '${createFormRequestDto.formId}' not found`);
    }

    // Get current version of the form to determine next version
    const currentVersion = form.version || 'v1';
    const versionNumber = parseInt(currentVersion.replace('v', '')) || 1;
    const nextVersion = `v${versionNumber + 1}`;

    // Get all current fields from the form
    const currentFields = await this.formFieldRepository.find({
      where: { formId: createFormRequestDto.formId },
      order: { step: 'ASC', order: 'ASC' },
    });

    // Helper function to deeply compare JSON values (handles arrays, objects, null, undefined)
    const deepEqual = (a: any, b: any): boolean => {
      // Handle null/undefined - treat both as equivalent
      if (a === null || a === undefined) {
        return b === null || b === undefined;
      }
      if (b === null || b === undefined) {
        return false;
      }

      // Handle arrays
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        // Compare arrays element by element (order matters)
        for (let i = 0; i < a.length; i++) {
          if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
      }

      // Handle objects (but not arrays or Date)
      if (typeof a === 'object' && typeof b === 'object' && 
          !Array.isArray(a) && !Array.isArray(b) &&
          !(a instanceof Date) && !(b instanceof Date)) {
        // Get all unique keys from both objects
        const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const key of allKeys) {
          if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
      }

      // Handle Date objects
      if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
      }

      // Primitive values (including numbers, strings, booleans)
      if (typeof a === 'number' && typeof b === 'number') {
        // Handle NaN and Infinity
        if (isNaN(a) && isNaN(b)) return true;
        return a === b;
      }

      return a === b;
    };

    // Helper function to normalize primitive values
    const normalize = (val: any): any => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string') return val.trim() || null;
      return val;
    };

    // Helper function to compare fields (excluding id, formId, createdAt, updatedAt)
    const areFieldsEqual = (field1: FormField, field2: Partial<CreateFormRequestDto['fields'][0]>): boolean => {
      // Compare basic fields
      if (field1.fieldKey !== field2.fieldKey) return false;
      if (field1.type !== field2.type) return false;
      if (normalize(field1.label) !== normalize(field2.label)) return false;
      if (normalize(field1.title) !== normalize(field2.title)) return false;
      if (normalize(field1.placeholder) !== normalize(field2.placeholder)) return false;
      if ((field1.required ?? false) !== (field2.required ?? false)) return false;
      if ((field1.isSingle ?? false) !== (field2.isSingle ?? false)) return false;
      if (field1.order !== field2.order) return false;
      if (field1.step !== field2.step) return false;
      if ((field1.width || 'full') !== (field2.width || 'full')) return false;
      if ((field1.includeInKycVerification ?? false) !== (field2.includeInKycVerification ?? false)) return false;

      // Compare complex JSON fields using deep equality
      if (!deepEqual(field1.options, field2.options)) return false;
      if (!deepEqual(field1.validation, field2.validation)) return false;
      if (!deepEqual(field1.conditions, field2.conditions)) return false;
      if (!deepEqual(field1.metadata, field2.metadata)) return false;

      return true;
    };

    // Create a map of current fields by fieldKey for quick lookup
    const currentFieldsMap = new Map(
      currentFields.map((f) => [f.fieldKey, f])
    );

    // Create form request
    const formRequest = this.formRequestRepository.create({
      formId: createFormRequestDto.formId,
      title: createFormRequestDto.title,
      slug: createFormRequestDto.slug,
      description: createFormRequestDto.description,
      schema: createFormRequestDto.schema,
      isPublic: form.isPublic,
      status: FormRequestStatus.PENDING,
      version: nextVersion,
      requestedBy,
    });

    const savedFormRequest = await this.formRequestRepository.save(formRequest);

    // Create field requests - include ALL fields (changed and unchanged)
    const fieldRequests: FormFieldRequest[] = [];

    // Process fields from request - compare with current fields to determine if truly changed
    for (const fieldDto of createFormRequestDto.fields) {
      const currentField = currentFieldsMap.get(fieldDto.fieldKey);
      const incomingAction = (fieldDto.action as FieldAction) || FieldAction.UPDATE;
      
      // Determine the actual action by comparing with current field
      let actualAction: FieldAction;
      
      // Handle DELETE action - don't change it
      if (incomingAction === FieldAction.DELETE) {
        actualAction = FieldAction.DELETE;
      }
      // If field doesn't exist in current form, it must be CREATE
      else if (!currentField) {
        actualAction = FieldAction.CREATE;
      }
      // If field exists in current form
      else {
        // If incoming action is CREATE, but field exists, it's actually an UPDATE
        if (incomingAction === FieldAction.CREATE) {
          actualAction = FieldAction.UPDATE;
        }
        // Compare field properties to see if it's truly unchanged
        else if (areFieldsEqual(currentField, fieldDto)) {
          actualAction = FieldAction.UNCHANGED;
        } else {
          actualAction = FieldAction.UPDATE;
        }
      }

      fieldRequests.push(
        this.formFieldRequestRepository.create({
          formRequestId: savedFormRequest.id,
          fieldKey: fieldDto.fieldKey,
          label: fieldDto.label,
          title: fieldDto.title,
          type: fieldDto.type,
          options: fieldDto.options,
          required: fieldDto.required ?? false,
          isSingle: fieldDto.isSingle ?? false,
          placeholder: fieldDto.placeholder,
          validation: fieldDto.validation,
          conditions: fieldDto.conditions,
          order: fieldDto.order,
          step: fieldDto.step,
          metadata: fieldDto.metadata,
          width: fieldDto.width || 'full',
          includeInKycVerification: fieldDto.includeInKycVerification ?? false,
          version: nextVersion,
          originalFieldId: fieldDto.originalFieldId || currentField?.id,
          action: actualAction,
        })
      );
    }

    // Clone unchanged fields from current form that are NOT in the request
    for (const currentField of currentFields) {
      // Skip if this field was in the request (already processed above)
      const fieldInRequest = createFormRequestDto.fields.find(
        (f) => f.fieldKey === currentField.fieldKey
      );
      if (fieldInRequest) {
        continue;
      }

      // Clone unchanged field with v2 marker
      fieldRequests.push(
        this.formFieldRequestRepository.create({
          formRequestId: savedFormRequest.id,
          fieldKey: currentField.fieldKey,
          label: currentField.label,
          title: currentField.title,
          type: currentField.type,
          options: currentField.options,
          required: currentField.required,
          isSingle: currentField.isSingle,
          placeholder: currentField.placeholder,
          validation: currentField.validation,
          conditions: currentField.conditions,
          order: currentField.order,
          step: currentField.step,
          metadata: currentField.metadata,
          width: currentField.width,
          includeInKycVerification: currentField.includeInKycVerification,
          version: nextVersion,
          originalFieldId: currentField.id,
          action: FieldAction.UNCHANGED, // Mark as unchanged for cloned fields
        })
      );
    }

    await this.formFieldRequestRepository.save(fieldRequests);

    // Return with fields
    return this.findOne(savedFormRequest.id);
  }

  /**
   * Get all form requests
   */
  async findAll(): Promise<FormRequestResponseDto[]> {
    const requests = await this.formRequestRepository.find({
      relations: ['fields'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) =>
      plainToInstance(FormRequestResponseDto, {
        ...request,
        fields: request.fields.map((field) =>
          plainToInstance(FormFieldRequestResponseDto, field, {
            excludeExtraneousValues: true,
          }),
        ),
      }, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Get a single form request by ID
   */
  async findOne(id: string): Promise<FormRequestResponseDto> {
    const request = await this.formRequestRepository.findOne({
      where: { id },
      relations: ['fields'],
    });

    if (!request) {
      throw new NotFoundException(`Form request with ID '${id}' not found`);
    }

    return plainToInstance(FormRequestResponseDto, {
      ...request,
      fields: request.fields.map((field) =>
        plainToInstance(FormFieldRequestResponseDto, field, {
          excludeExtraneousValues: true,
        }),
      ),
    }, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Review (approve/reject) a form request
   */
  async review(
    id: string,
    reviewDto: ReviewFormRequestDto,
    reviewedBy: string,
  ): Promise<FormRequestResponseDto> {
    const request = await this.formRequestRepository.findOne({
      where: { id },
      relations: ['fields'],
    });

    if (!request) {
      throw new NotFoundException(`Form request with ID '${id}' not found`);
    }

    if (request.status !== FormRequestStatus.PENDING) {
      throw new BadRequestException(
        `Form request is already ${request.status}. Only pending requests can be reviewed.`,
      );
    }

    // Update request status
    request.status = reviewDto.status;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewDto.reviewNotes || null;

    await this.formRequestRepository.save(request);

    // If approved, apply the changes to the actual form
    if (reviewDto.status === FormRequestStatus.APPROVED) {
      await this.applyApprovedRequest(request, reviewDto.fieldDecisions);
    }

    return this.findOne(id);
  }

  /**
   * Apply approved request to the actual form
   * Creates a new version of the form with the approved changes
   * Only applies fields that are individually approved (or all if no decisions provided)
   */
  private async applyApprovedRequest(
    request: FormRequest,
    fieldDecisions?: Record<string, 'approved' | 'rejected'>,
  ): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // Get the original form
      const originalForm = await manager.findOne(Form, {
        where: { id: request.formId },
      });

      if (!originalForm) {
        throw new NotFoundException(`Form with ID '${request.formId}' not found`);
      }

      // Check if this is a registration form
      const isRegistrationForm = originalForm.slug === 'registration-form' && originalForm.isActive;

      if (isRegistrationForm) {
        // Create new version (versioning logic)
        const currentVersion = originalForm.version || 'v1';
        const versionNumber = parseInt(currentVersion.replace('v', '')) || 1;
        const nextVersion = `v${versionNumber + 1}`;

        // Deactivate old form
        originalForm.isActive = false;
        originalForm.slug = `registration-form-${currentVersion}`;
        await manager.save(originalForm);

        // Create new form version
        const newForm = manager.create(Form, {
          title: request.title,
          description: request.description,
          slug: 'registration-form',
          schema: request.schema,
          isPublic: request.isPublic,
          status: originalForm.status,
          createdBy: originalForm.createdBy,
          version: nextVersion,
          isActive: true,
        });

        const savedNewForm = await manager.save(newForm);

        // Get original form fields to build ID mapping
        const originalFields = await manager.find(FormField, {
          where: { formId: originalForm.id },
        });

        // Build mapping: originalFieldId -> fieldKey
        const originalIdToFieldKey = new Map<string, string>();
        originalFields.forEach((field) => {
          originalIdToFieldKey.set(field.id, field.fieldKey);
        });

        // Process field requests - all fields (changed and unchanged) are already in the request
        // with v2 marker, so we just need to save them directly
        // Filter based on individual field decisions if provided
        const fieldsToCreate: FormField[] = [];

        // First pass: collect approved fields
        for (const fieldRequest of request.fields) {
          if (fieldRequest.action === FieldAction.DELETE) {
            // Skip deleted fields - they won't be copied to new form
            continue;
          }

          // If field decisions are provided, filter based on decisions
          // fieldDecisions can be:
          // - undefined: apply all fields (backward compatibility - no filtering requested)
          // - empty object {}: no individual decisions made, apply all fields
          // - object with decisions: filter based on individual decisions
          if (fieldDecisions !== undefined) {
            // Check if any decisions were actually made
            const hasAnyDecisions = Object.keys(fieldDecisions).length > 0;
            
            if (hasAnyDecisions) {
              // Individual decisions were made - filter based on them
              const decision = fieldDecisions[fieldRequest.fieldKey];
              
              // If field is explicitly rejected, skip it
              if (decision === 'rejected') {
                continue;
              }
              
              // For unchanged fields: approved by default (apply unless explicitly rejected)
              if (fieldRequest.action === FieldAction.UNCHANGED) {
                // Unchanged fields are approved by default - only skip if explicitly rejected
                // (already handled above, so continue to apply)
              } else {
                // For changed fields (create/update/delete): require explicit approval
                // Only apply if decision is explicitly 'approved'
                if (decision !== 'approved') {
                  continue;
                }
              }
            }
            // If fieldDecisions is empty object (no decisions made), apply all fields
          }
          // If fieldDecisions is undefined, apply all fields (backward compatibility)

          // Create field from request (all fields in request already have v2 marker)
          const newField = manager.create(FormField, {
            formId: savedNewForm.id,
            fieldKey: fieldRequest.fieldKey,
            label: fieldRequest.label,
            title: fieldRequest.title,
            type: fieldRequest.type,
            options: fieldRequest.options,
            required: fieldRequest.required,
            isSingle: fieldRequest.isSingle,
            placeholder: fieldRequest.placeholder,
            validation: fieldRequest.validation,
            conditions: fieldRequest.conditions, // Will update conditions after saving
            order: fieldRequest.order,
            step: fieldRequest.step,
            metadata: fieldRequest.metadata,
            width: fieldRequest.width,
            includeInKycVerification: fieldRequest.includeInKycVerification,
          });
          fieldsToCreate.push(newField);
        }

        // Save all fields first to get their new IDs
        if (fieldsToCreate.length > 0) {
          await manager.save(fieldsToCreate);
        }

        // Build mapping: fieldKey -> newFieldId
        const fieldKeyToNewId = new Map<string, string>();
        fieldsToCreate.forEach((field) => {
          fieldKeyToNewId.set(field.fieldKey, field.id);
        });

        // Second pass: update conditions to use new field IDs
        for (const newField of fieldsToCreate) {
          if (newField.conditions && Array.isArray(newField.conditions) && newField.conditions.length > 0) {
            const updatedConditions = newField.conditions.map((condition: any) => {
              if (condition.field) {
                // condition.field is the old field ID
                // Find the fieldKey for this old ID
                const fieldKey = originalIdToFieldKey.get(condition.field);
                if (fieldKey) {
                  // Find the new field ID for this fieldKey
                  const newFieldId = fieldKeyToNewId.get(fieldKey);
                  if (newFieldId) {
                    // Update condition to use new field ID
                    return {
                      ...condition,
                      field: newFieldId,
                    };
                  }
                }
              }
              return condition;
            });
            newField.conditions = updatedConditions;
          }
        }

        // Save fields again with updated conditions
        if (fieldsToCreate.length > 0) {
          await manager.save(fieldsToCreate);
        }
      } else {
        // For non-registration forms, update directly (no versioning)
        originalForm.title = request.title;
        originalForm.description = request.description;
        originalForm.schema = request.schema;
        await manager.save(originalForm);

        // Update fields
        // This is a simplified version - for non-registration forms
        // You might want to implement similar logic
      }
    });
  }

  /**
   * Delete a form request
   */
  async remove(id: string): Promise<{ message: string }> {
    const request = await this.formRequestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Form request with ID '${id}' not found`);
    }

    await this.formRequestRepository.remove(request);

    return { message: `Form request with ID '${id}' has been deleted successfully` };
  }
}

