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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FormRequestsService } from './form-requests.service';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { ReviewFormRequestDto } from './dto/review-form-request.dto';
import { FormRequestResponseDto } from './dto/form-request-response.dto';

@ApiTags('Form Requests')
@Controller()
export class FormRequestsController {
  constructor(private readonly formRequestsService: FormRequestsService) {}

  @Post('admin/form-requests')
  @ApiOperation({ summary: 'Create a form request for approval' })
  @ApiBody({ type: CreateFormRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Form request created successfully',
    type: FormRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async create(
    @Body() createFormRequestDto: CreateFormRequestDto,
    @Request() req: any,
  ): Promise<FormRequestResponseDto> {
    const requestedBy = req.user?.id;
    return this.formRequestsService.create(createFormRequestDto, requestedBy);
  }

  @Get('admin/form-requests')
  @ApiOperation({ summary: 'Get all form requests' })
  @ApiResponse({
    status: 200,
    description: 'List of all form requests',
    type: [FormRequestResponseDto],
  })
  async findAll(): Promise<FormRequestResponseDto[]> {
    return this.formRequestsService.findAll();
  }

  @Get('admin/form-requests/:id')
  @ApiOperation({ summary: 'Get a form request by ID' })
  @ApiParam({ name: 'id', description: 'Form Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Form request details',
    type: FormRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Form request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormRequestResponseDto> {
    return this.formRequestsService.findOne(id);
  }

  @Put('admin/form-requests/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) a form request' })
  @ApiParam({ name: 'id', description: 'Form Request ID (UUID)' })
  @ApiBody({ type: ReviewFormRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Form request reviewed successfully',
    type: FormRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Form request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewFormRequestDto,
    @Request() req: any,
  ): Promise<FormRequestResponseDto> {
    const reviewedBy = req.user?.id;
    return this.formRequestsService.review(id, reviewDto, reviewedBy);
  }

  @Delete('admin/form-requests/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a form request' })
  @ApiParam({ name: 'id', description: 'Form Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Form request deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Form request not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.formRequestsService.remove(id);
  }
}

