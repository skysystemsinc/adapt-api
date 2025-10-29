import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata,
  BadRequestException,
  Scope,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ReorderFieldsDto } from 'src/modules/forms/dto/reorder-fields.dto';

/**
 * Custom validation pipe specifically for the reorder fields endpoint
 * This accesses the raw request body to bypass the global ValidationPipe
 */
@Injectable({ scope: Scope.REQUEST })
export class ReorderFieldsValidationPipe implements PipeTransform<any> {
  constructor(@Inject(REQUEST) private readonly request: any) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Get the raw body from request (before global pipe stripped it)
    // The global pipe might have already processed and stripped properties
    // So we check both the raw body and the already-processed value
    let bodyToValidate = value;
    
    // Try to get raw body if available (preserved by interceptor if used)
    if (this.request.__rawBody) {
      bodyToValidate = this.request.__rawBody;
    } else if (this.request.body && this.request.body !== value) {
      // Fallback to request.body if different from processed value
      bodyToValidate = this.request.body;
    }
    
    // If body is missing 'fields' property, it was likely stripped
    // Check if we have a raw JSON body
    if (!bodyToValidate || !bodyToValidate.fields) {
      // Last resort: check if value itself has fields (global pipe might have kept it)
      if (value && typeof value === 'object' && 'fields' in value) {
        bodyToValidate = value;
      } else {
        // If still no fields, throw error
        throw new BadRequestException({
          message: ['fields property is required'],
          error: 'Validation failed',
          statusCode: 400,
        });
      }
    }
    
    // Transform and validate
    const object = plainToInstance(ReorderFieldsDto, bodyToValidate);
    
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const messages = this.flattenValidationErrors(errors);
      throw new BadRequestException({
        message: messages,
        error: 'Validation failed',
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private flattenValidationErrors(errors: any[]): string[] {
    const messages: string[] = [];
    errors.forEach((error) => {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints).map(v => String(v)));
      }
      if (error.children && error.children.length > 0) {
        messages.push(...this.flattenValidationErrors(error.children));
      }
    });
    return messages;
  }
}

