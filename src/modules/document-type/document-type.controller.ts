import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { DocumentTypeService } from './document-type.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { DocumentType } from './entities/document-type.entity';

@ApiTags('Document Types')
@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document type' })
  @ApiBody({ type: CreateDocumentTypeDto })
  @ApiResponse({ status: 201, description: 'Document type created', type: DocumentType })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateDocumentTypeDto): Promise<DocumentType> {
    return this.documentTypeService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all document types' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Include soft-deleted records' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive records' })
  @ApiResponse({ status: 200, description: 'List of document types', type: [DocumentType] })
  async findAll(
    @Query('includeDeleted') includeDeleted?: boolean,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<DocumentType[]> {
    return this.documentTypeService.findAll(includeDeleted === true, includeInactive === true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document type by ID' })
  @ApiParam({ name: 'id', description: 'Document type ID' })
  @ApiResponse({ status: 200, description: 'Document type found', type: DocumentType })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentType> {
    return this.documentTypeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a document type' })
  @ApiParam({ name: 'id', description: 'Document type ID' })
  @ApiBody({ type: UpdateDocumentTypeDto })
  @ApiResponse({ status: 200, description: 'Document type updated', type: DocumentType })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDocumentTypeDto,
  ): Promise<DocumentType> {
    return this.documentTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a document type' })
  @ApiParam({ name: 'id', description: 'Document type ID' })
  @ApiResponse({ status: 204, description: 'Document type soft deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.documentTypeService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted document type' })
  @ApiParam({ name: 'id', description: 'Document type ID' })
  @ApiResponse({ status: 200, description: 'Document type restored', type: DocumentType })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentType> {
    return this.documentTypeService.restore(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a document type' })
  @ApiParam({ name: 'id', description: 'Document type ID' })
  @ApiResponse({ status: 204, description: 'Document type permanently deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async permanentlyDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.documentTypeService.permanentlyDelete(id);
  }
}

