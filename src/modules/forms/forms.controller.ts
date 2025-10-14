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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { FormResponseDto } from './dto/form-response.dto';

@ApiTags('Forms')
@Controller()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post('admin/forms')
  @ApiOperation({ summary: 'Create a new form' })
  @ApiBody({ type: CreateFormDto })
  @ApiResponse({
    status: 201,
    description: 'Form created successfully',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(@Body() createFormDto: CreateFormDto): Promise<FormResponseDto> {
    return this.formsService.create(createFormDto);
  }

  @Get('admin/forms')
  @ApiOperation({ summary: 'Get all forms' })
  @ApiResponse({
    status: 200,
    description: 'List of all forms',
    type: [FormResponseDto],
  })
  async findAll(): Promise<FormResponseDto[]> {
    return this.formsService.findAll();
  }

  @Get('admin/forms/:id')
  @ApiOperation({ summary: 'Get a form by ID' })
  @ApiParam({ name: 'id', description: 'Form ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Form details',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormResponseDto> {
    return this.formsService.findOne(id);
  }

  @Put('admin/forms/:id')
  @ApiOperation({ summary: 'Update a form' })
  @ApiParam({ name: 'id', description: 'Form ID (UUID)' })
  @ApiBody({ type: UpdateFormDto })
  @ApiResponse({
    status: 200,
    description: 'Form updated successfully',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFormDto: UpdateFormDto,
  ): Promise<FormResponseDto> {
    return this.formsService.update(id, updateFormDto);
  }

  @Delete('admin/forms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a form' })
  @ApiParam({ name: 'id', description: 'Form ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Form deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.formsService.remove(id);
  }

  // ==================== PUBLIC ROUTES ====================
  // Prefix: /api/forms

  @Get('forms/:slug')
  @ApiOperation({ summary: 'Get a public form by slug' })
  @ApiParam({ name: 'slug', description: 'Form slug' })
  @ApiResponse({
    status: 200,
    description: 'Public form details',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findBySlug(@Param('slug') slug: string): Promise<FormResponseDto> {
    return this.formsService.findBySlug(slug);
  }
}

