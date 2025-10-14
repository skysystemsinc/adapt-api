import {
  Controller,
  Post,
  Get,
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

import { FormSubmissionsService } from './form-submissions.service';
import { SubmitFormDto } from './dto/submit-form.dto';
import { FormSubmissionResponseDto } from './dto/form-submission-response.dto';

@ApiTags('Form Submissions')
@Controller()
export class FormSubmissionsController {
  constructor(
    private readonly formSubmissionsService: FormSubmissionsService,
  ) {}

  @Post('form-submissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a form' })
  @ApiBody({ type: SubmitFormDto })
  @ApiResponse({
    status: 201,
    description: 'Form submitted successfully',
    type: FormSubmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid fields submitted' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async submitForm(
    @Body() submitFormDto: SubmitFormDto,
  ): Promise<FormSubmissionResponseDto> {
    return this.formSubmissionsService.submitForm(submitFormDto);
  }

  @Get('admin/submissions/:id')
  @ApiOperation({ summary: 'Get a submission by ID' })
  @ApiParam({ name: 'id', description: 'Submission ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Submission details',
    type: FormSubmissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormSubmissionResponseDto> {
    return this.formSubmissionsService.findOne(id);
  }

  @Get('admin/forms/:slug/submissions')
  @ApiOperation({ summary: 'Get all submissions for a form' })
  @ApiParam({ name: 'slug', description: 'Form slug' })
  @ApiResponse({
    status: 200,
    description: 'List of submissions',
    type: [FormSubmissionResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findByFormSlug(
    @Param('slug') slug: string,
  ): Promise<FormSubmissionResponseDto[]> {
    return this.formSubmissionsService.findByFormSlug(slug);
  }
}

