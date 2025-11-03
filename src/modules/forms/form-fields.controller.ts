import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FormFieldsService } from './form-fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { ReorderFieldsDto } from './dto/reorder-fields.dto';
import { FormField } from './entities/form-field.entity';

@ApiTags('Form Fields')
@Controller()
export class FormFieldsController {
  constructor(private readonly formFieldsService: FormFieldsService) {}

  @Get('admin/forms/:formId/fields')
  @ApiOperation({ summary: 'Get all fields for a form' })
  @ApiParam({ name: 'formId', description: 'Form ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'List of all fields for the form',
    type: [FormField],
  })
  async getFormFields(
    @Param('formId', ParseUUIDPipe) formId: string,
  ): Promise<FormField[]> {
    return this.formFieldsService.getFieldsByFormId(formId);
  }

  @Post('admin/forms/:formId/fields')
  @ApiOperation({ summary: 'Create a new field' })
  @ApiParam({ name: 'formId', description: 'Form ID (UUID)' })
  @ApiBody({ type: CreateFieldDto })
  @ApiResponse({
    status: 201,
    description: 'Field created successfully',
    type: FormField,
  })
  async createField(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Body() createFieldDto: CreateFieldDto,
  ): Promise<FormField> {
    return this.formFieldsService.createField(formId, createFieldDto);
  }

  @Put('admin/forms/:formId/fields/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder fields within a form' })
  @ApiParam({ name: 'formId', description: 'Form ID (UUID)' })
  @ApiBody({ 
    type: ReorderFieldsDto,
    description: 'Array of fields with their new order and step positions',
  })
  @ApiResponse({
    status: 200,
    description: 'Fields reordered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request - field IDs do not belong to form or validation failed' 
  })
  async reorderFields(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, // Override global pipe for this endpoint
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    reorderFieldsDto: ReorderFieldsDto,
  ): Promise<{ message: string }> {
    return this.formFieldsService.reorderFields(
      formId,
      reorderFieldsDto.fields,
    );
  }

  @Put('admin/forms/:formId/fields/:fieldId')
  @ApiOperation({ summary: 'Update a field' })
  @ApiParam({ name: 'formId', description: 'Form ID (UUID)' })
  @ApiParam({ name: 'fieldId', description: 'Field ID (UUID)' })
  @ApiBody({ type: UpdateFieldDto })
  @ApiResponse({
    status: 200,
    description: 'Field updated successfully',
    type: FormField,
  })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async updateField(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() updateFieldDto: UpdateFieldDto,
  ): Promise<FormField> {
    return this.formFieldsService.updateField(fieldId, updateFieldDto);
  }

  @Delete('admin/forms/:formId/fields/:fieldId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a field' })
  @ApiParam({ name: 'formId', description: 'Form ID (UUID)' })
  @ApiParam({ name: 'fieldId', description: 'Field ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Field deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async deleteField(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
  ): Promise<{ message: string }> {
    return this.formFieldsService.deleteField(fieldId);
  }
}
