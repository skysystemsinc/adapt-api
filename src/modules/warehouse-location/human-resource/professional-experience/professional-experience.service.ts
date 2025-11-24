import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfessionalExperienceDto } from './dto/create-professional-experience.dto';
import { ProfessionalExperience } from './entities/professional-experience.entity';
import { HumanResource } from '../entities/human-resource.entity';
import { WarehouseDocument } from '../../../warehouse/entities/warehouse-document.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfessionalExperienceService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(ProfessionalExperience)
    private readonly professionalExperienceRepository: Repository<ProfessionalExperience>,
    @InjectRepository(HumanResource)
    private readonly humanResourceRepository: Repository<HumanResource>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  private async uploadWarehouseDocument(
    file: any,
    userId: string,
    documentableType: string,
    documentableId: string,
    documentType: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
      );
    }

    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const documentPath = `/uploads/${sanitizedFilename}`;

    await fs.writeFile(filePath, file.buffer);

    const mimeType = file.mimetype || 'application/octet-stream';

    const document = this.warehouseDocumentRepository.create({
      userId,
      documentableType,
      documentableId,
      documentType,
      originalFileName: file.originalname,
      filePath: documentPath,
      mimeType,
      isActive: true,
    });

    return this.warehouseDocumentRepository.save(document);
  }

  private async deleteWarehouseDocument(documentId: string): Promise<void> {
    const document = await this.warehouseDocumentRepository.findOne({
      where: { id: documentId }
    });

    if (document) {
      try {
        const filePath = document.filePath.startsWith('/')
          ? path.join(process.cwd(), document.filePath.substring(1))
          : path.join(process.cwd(), document.filePath);
        
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Error deleting file ${document.filePath}:`, error);
      }

      await this.warehouseDocumentRepository.remove(document);
    }
  }

  async create(
    hrId: string,
    createProfessionalExperienceDto: CreateProfessionalExperienceDto,
    userId: string,
    experienceLetterFile?: any
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    const { experienceLetter, ...experienceData } = createProfessionalExperienceDto;

    // Convert null to undefined for date fields to satisfy TypeORM's DeepPartial type
    const { dateOfAppointment, dateOfLeaving, ...restExperienceData } = experienceData;
    const experience = this.professionalExperienceRepository.create({
      humanResourceId: hrId,
      ...restExperienceData,
      dateOfAppointment: dateOfAppointment ?? undefined,
      dateOfLeaving: dateOfLeaving ?? undefined,
    });

    const savedExperience = await this.professionalExperienceRepository.save(experience);

    if (experienceLetterFile) {
      const documentResult = await this.uploadWarehouseDocument(
        experienceLetterFile,
        userId,
        'ProfessionalExperience',
        savedExperience.id,
        'experienceLetter'
      );

      const letterDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (letterDocument) {
        savedExperience.experienceLetter = letterDocument;
        await this.professionalExperienceRepository.save(savedExperience);
      }
    }

    return savedExperience;
  }

  async update(
    expId: string,
    hrId: string,
    updateProfessionalExperienceDto: CreateProfessionalExperienceDto,
    userId: string,
    experienceLetterFile?: any
  ) {
    const experience = await this.professionalExperienceRepository.findOne({
      where: { id: expId, humanResourceId: hrId },
      relations: ['experienceLetter'],
    });

    if (!experience) {
      throw new NotFoundException('Professional experience not found');
    }

    const { experienceLetter, ...experienceData } = updateProfessionalExperienceDto;

    Object.assign(experience, experienceData);
    const savedExperience = await this.professionalExperienceRepository.save(experience);

    if (experienceLetterFile) {
      if (experience.experienceLetter) {
        await this.deleteWarehouseDocument(experience.experienceLetter.id);
      }

      const documentResult = await this.uploadWarehouseDocument(
        experienceLetterFile,
        userId,
        'ProfessionalExperience',
        savedExperience.id,
        'experienceLetter'
      );

      const letterDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (letterDocument) {
        savedExperience.experienceLetter = letterDocument;
        await this.professionalExperienceRepository.save(savedExperience);
      }
    } else {
      if (experienceLetter && typeof experienceLetter === 'string') {
        const existingDocument = await this.warehouseDocumentRepository.findOne({
          where: { 
            id: experienceLetter,
            documentableType: 'ProfessionalExperience',
            documentableId: savedExperience.id,
            documentType: 'experienceLetter'
          }
        });

        if (!existingDocument) {
          throw new BadRequestException('Invalid document ID provided or document does not belong to this experience');
        }

        savedExperience.experienceLetter = existingDocument;
        await this.professionalExperienceRepository.save(savedExperience);
      } else {
        savedExperience.experienceLetter = experience.experienceLetter;
        await this.professionalExperienceRepository.save(savedExperience);
      }
    }

    return savedExperience;
  }

  async remove(expId: string, hrId: string) {
    const experience = await this.professionalExperienceRepository.findOne({
      where: { id: expId, humanResourceId: hrId },
      relations: ['experienceLetter'],
    });

    if (!experience) {
      throw new NotFoundException('Professional experience not found');
    }

    if (experience.experienceLetter) {
      await this.deleteWarehouseDocument(experience.experienceLetter.id);
    }

    await this.professionalExperienceRepository.remove(experience);

    return { message: 'Professional experience deleted successfully' };
  }

  findAll() {
    return `This action returns all professionalExperience`;
  }

  findOne(id: number) {
    return `This action returns a #${id} professionalExperience`;
  }
}
