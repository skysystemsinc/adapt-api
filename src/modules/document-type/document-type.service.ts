import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from './entities/document-type.entity';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypeService {
  constructor(
    @InjectRepository(DocumentType)
    private documentTypeRepository: Repository<DocumentType>,
  ) {}

  async create(createDto: CreateDocumentTypeDto): Promise<DocumentType> {
    const documentType = this.documentTypeRepository.create(createDto);
    return this.documentTypeRepository.save(documentType);
  }

  async findAll(includeDeleted: boolean = false, includeInactive: boolean = false): Promise<DocumentType[]> {
    const where: any = {};
    
    // By default, only return active document types
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.documentTypeRepository.find({
      where,
      withDeleted: includeDeleted,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, includeDeleted: boolean = false): Promise<DocumentType> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
    });

    if (!documentType) {
      throw new NotFoundException(`Document type with ID "${id}" not found`);
    }

    return documentType;
  }

  async update(id: string, updateDto: UpdateDocumentTypeDto): Promise<DocumentType> {
    const documentType = await this.findOne(id);
    Object.assign(documentType, updateDto);
    return this.documentTypeRepository.save(documentType);
  }

  async remove(id: string): Promise<void> {
    const documentType = await this.findOne(id);
    await this.documentTypeRepository.softDelete(id);
  }

  async restore(id: string): Promise<DocumentType> {
    const documentType = await this.findOne(id, true);

    if (!documentType.deletedAt) {
      throw new ConflictException('Document type is not deleted');
    }

    await this.documentTypeRepository.restore(id);
    return this.findOne(id);
  }

  async permanentlyDelete(id: string): Promise<void> {
    const documentType = await this.findOne(id, true);
    await this.documentTypeRepository.remove(documentType);
  }
}

