import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateHumanResourceDto } from './dto/create-human-resource.dto';
import { CreateDeclarationDto } from './declaration/dto/create-declaration.dto';
import { HumanResource } from './entities/human-resource.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { WarehouseDocument } from '../../warehouse/entities/warehouse-document.entity';
import { Declaration } from './declaration/entities/declaration.entity';
import { AcademicQualification } from './academic-qualification/entities/academic-qualification.entity';
import { ProfessionalQualification } from './professional-qualification/entities/professional-qualification.entity';
import { Training } from './training/entities/training.entity';
import { ProfessionalExperience } from './professional-experience/entities/professional-experience.entity';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class HumanResourceService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(HumanResource)
    private readonly humanResourceRepository: Repository<HumanResource>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    @InjectRepository(Declaration)
    private readonly declarationRepository: Repository<Declaration>,
    @InjectRepository(AcademicQualification)
    private readonly academicQualificationRepository: Repository<AcademicQualification>,
    @InjectRepository(ProfessionalQualification)
    private readonly professionalQualificationRepository: Repository<ProfessionalQualification>,
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    @InjectRepository(ProfessionalExperience)
    private readonly professionalExperienceRepository: Repository<ProfessionalExperience>,
    private readonly dataSource: DataSource,
  ) {
    // Ensure upload directory exists
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

    // Validate file type
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
      );
    }

    // Validate file size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
      );
    }

    // Generate unique filename
    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const documentPath = `/uploads/${sanitizedFilename}`;

    // Encrypt file before saving
    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);

    // Save encrypted file to disk
    await fs.writeFile(filePath, encrypted);

    // Detect MIME type
    const mimeType = file.mimetype || 'application/octet-stream';

    // Create document record
    const document = this.warehouseDocumentRepository.create({
      userId,
      documentableType,
      documentableId,
      documentType,
      originalFileName: file.originalname,
      filePath: documentPath,
      mimeType,
      iv,
      authTag,
      isActive: true,
    });

    return this.warehouseDocumentRepository.save(document);
  }

  /**
   * Delete warehouse document (file from disk and database record)
   */
  private async deleteWarehouseDocument(documentId: string): Promise<void> {
    const document = await this.warehouseDocumentRepository.findOne({
      where: { id: documentId }
    });

    if (document) {
      // Delete file from disk
      try {
        // Remove leading slash if present and construct full path
        const filePath = document.filePath.startsWith('/')
          ? path.join(process.cwd(), document.filePath.substring(1))
          : path.join(process.cwd(), document.filePath);
        
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, log but don't fail
        console.error(`Error deleting file ${document.filePath}:`, error);
      }

      // Delete document record from database
      await this.warehouseDocumentRepository.remove(document);
    }
  }

  /**
   * Get all HR entries by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const humanResources = await this.humanResourceRepository.find({
      where: { warehouseLocationId },
      relations: [
        'photograph',
        'academicQualifications',
        'academicQualifications.academicCertificate',
        'professionalQualifications',
        'professionalQualifications.professionalCertificate',
        'trainings',
        'trainings.trainingCertificate',
        'professionalExperiences',
        'professionalExperiences.experienceLetter',
        'declaration',
      ],
      order: {
        createdAt: 'ASC',
      },
    });

    return humanResources;
  }

  /**
   * Create HR entry with personal details
   */
  async createPersonalDetails(
    warehouseLocationId: string,
    CreateHumanResourceDto: CreateHumanResourceDto,
    userId: string,
    photographFile?: any,
    hrId?: string
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('HR information can only be added while application is in draft status');
    }

    // Remove file field from DTO before saving
    const { photograph, ...personalDetailsData } = CreateHumanResourceDto;

    if (hrId) {
      // Update existing HR entry
      const existingHR = await this.humanResourceRepository.findOne({
        where: { id: hrId, warehouseLocationId },
        relations: ['photograph'],
      });

      if (!existingHR) {
        throw new NotFoundException('HR entry not found');
      }

      Object.assign(existingHR, personalDetailsData);
      const savedHR = await this.humanResourceRepository.save(existingHR);

      // Handle photograph file upload/update
      if (photographFile) {
        // New file provided - delete old file and upload new one
        if (existingHR.photograph) {
          await this.deleteWarehouseDocument(existingHR.photograph.id);
        }

        const documentResult = await this.uploadWarehouseDocument(
          photographFile,
          userId,
          'HumanResource',
          savedHR.id,
          'photograph'
        );

        const photographDocument = await this.warehouseDocumentRepository.findOne({
          where: { id: documentResult.id }
        });

        if (photographDocument) {
          savedHR.photograph = photographDocument;
          await this.humanResourceRepository.save(savedHR);
        }
      } else {
        // No new file provided - handle string (document ID) in DTO or keep existing
        if (photograph && typeof photograph === 'string') {
          // User sent document ID as string - validate it exists and belongs to this HR
          const existingDocument = await this.warehouseDocumentRepository.findOne({
            where: { 
              id: photograph,
              documentableType: 'HumanResource',
              documentableId: savedHR.id,
              documentType: 'photograph'
            }
          });

          if (!existingDocument) {
            throw new BadRequestException('Invalid document ID provided or document does not belong to this HR entry');
          }

          // Keep the existing document
          savedHR.photograph = existingDocument;
          await this.humanResourceRepository.save(savedHR);
        } else {
          // Keep existing photograph if no new file and no document ID in DTO
          savedHR.photograph = existingHR.photograph;
          await this.humanResourceRepository.save(savedHR);
        }
      }

      return savedHR;
    }

    // Create new HR entry
    // Convert null to undefined for dateOfBirth to satisfy TypeORM's DeepPartial type
    const { dateOfBirth, ...restPersonalDetails } = personalDetailsData;
    const humanResource = this.humanResourceRepository.create({
      warehouseLocationId,
      ...restPersonalDetails,
      dateOfBirth: dateOfBirth ?? undefined,
    });

    const savedHR = await this.humanResourceRepository.save(humanResource);

    // Upload and link photograph file if provided
    if (photographFile) {
      const documentResult = await this.uploadWarehouseDocument(
        photographFile,
        userId,
        'HumanResource',
        savedHR.id,
        'photograph'
      );

      const photographDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (photographDocument) {
        savedHR.photograph = photographDocument;
        await this.humanResourceRepository.save(savedHR);
      }
    }

    return savedHR;
  }

  /**
   * Create or update declaration
   */
  async createOrUpdateDeclaration(
    hrId: string,
    createDeclarationDto: CreateDeclarationDto,
    userId: string
  ) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
      relations: ['declaration'],
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    // Check warehouse location status
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: humanResource.warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Declaration can only be updated while application is in draft status');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const hrRepo = manager.getRepository(HumanResource);
      const declarationRepo = manager.getRepository(Declaration);

      const currentHR = await hrRepo.findOne({
        where: { id: hrId },
        relations: ['declaration'],
      });

      if (currentHR?.declaration) {
        // Update existing declaration
        Object.assign(currentHR.declaration, createDeclarationDto);
        await declarationRepo.save(currentHR.declaration);
        return currentHR.declaration;
      } else {
        // Create new declaration
        const declaration = declarationRepo.create({
          humanResourceId: hrId,
          ...createDeclarationDto,
        });
        await declarationRepo.save(declaration);

        currentHR!.declaration = declaration;
        await hrRepo.save(currentHR!);

        return declaration;
      }
    });

    return savedResult;
  }

  /**
   * Delete HR entry and all related data
   */
  async deleteHumanResource(hrId: string, userId: string) {
    const humanResource = await this.humanResourceRepository.findOne({
      where: { id: hrId },
      relations: [
        'photograph',
        'academicQualifications',
        'academicQualifications.academicCertificate',
        'professionalQualifications',
        'professionalQualifications.professionalCertificate',
        'trainings',
        'trainings.trainingCertificate',
        'professionalExperiences',
        'professionalExperiences.experienceLetter',
        'declaration',
      ],
    });

    if (!humanResource) {
      throw new NotFoundException('HR entry not found');
    }

    // Check warehouse location status
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: humanResource.warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('HR entry can only be deleted while application is in draft status');
    }

    // Delete all associated files
    if (humanResource.photograph) {
      await this.deleteWarehouseDocument(humanResource.photograph.id);
    }

    // Delete academic qualification files
    for (const qual of humanResource.academicQualifications || []) {
      if (qual.academicCertificate) {
        await this.deleteWarehouseDocument(qual.academicCertificate.id);
      }
    }

    // Delete professional qualification files
    for (const qual of humanResource.professionalQualifications || []) {
      if (qual.professionalCertificate) {
        await this.deleteWarehouseDocument(qual.professionalCertificate.id);
      }
    }

    // Delete training files
    for (const training of humanResource.trainings || []) {
      if (training.trainingCertificate) {
        await this.deleteWarehouseDocument(training.trainingCertificate.id);
      }
    }

    // Delete experience files
    for (const exp of humanResource.professionalExperiences || []) {
      if (exp.experienceLetter) {
        await this.deleteWarehouseDocument(exp.experienceLetter.id);
      }
    }

    // Delete all related records before deleting the human resource
    // This is necessary because foreign key constraints prevent deletion if related records exist
    
    // Delete academic qualifications
    if (humanResource.academicQualifications && humanResource.academicQualifications.length > 0) {
      await this.academicQualificationRepository.remove(humanResource.academicQualifications);
    }

    // Delete professional qualifications
    if (humanResource.professionalQualifications && humanResource.professionalQualifications.length > 0) {
      await this.professionalQualificationRepository.remove(humanResource.professionalQualifications);
    }

    // Delete trainings
    if (humanResource.trainings && humanResource.trainings.length > 0) {
      await this.trainingRepository.remove(humanResource.trainings);
    }

    // Delete professional experiences
    if (humanResource.professionalExperiences && humanResource.professionalExperiences.length > 0) {
      await this.professionalExperienceRepository.remove(humanResource.professionalExperiences);
    }

    // Delete declaration if it exists
    if (humanResource.declaration) {
      await this.declarationRepository.remove(humanResource.declaration);
    }

    // Now delete the HR entry (all related records have been removed)
    await this.humanResourceRepository.remove(humanResource);

    return { message: 'HR entry deleted successfully' };
  }

  // Legacy methods (kept for backward compatibility)
  create(createHumanResourceDto: any) {
    return 'This action adds a new humanResource';
  }

  findAll() {
    return `This action returns all humanResource`;
  }

  findOne(id: number) {
    return `This action returns a #${id} humanResource`;
  }

  update(id: number, updateHumanResourceDto: any) {
    return `This action updates a #${id} humanResource`;
  }

  remove(id: number) {
    return `This action removes a #${id} humanResource`;
  }

  async downloadWarehouseDocument(documentId: string) {
    const document = await this.warehouseDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Construct full file path
    const filename = path.basename(document.filePath);
    const fullPath = path.join(this.uploadDir, filename);

    if (!fsSync.existsSync(fullPath)) {
      throw new NotFoundException('File not found on disk');
    }

    // Read encrypted file
    const encryptedBuffer = fsSync.readFileSync(fullPath);

    // Decrypt if iv and authTag are present
    let decryptedBuffer: Buffer;
    if (document.iv && document.authTag) {
      try {
        decryptedBuffer = decryptBuffer(encryptedBuffer, document.iv, document.authTag);
      } catch (error: any) {
        throw new BadRequestException(`Failed to decrypt document: ${error.message}`);
      }
    } else {
      // Backward compatibility - assume unencrypted
      decryptedBuffer = encryptedBuffer;
    }

    return {
      buffer: decryptedBuffer,
      mimeType: document.mimeType || 'application/octet-stream',
      filename: document.originalFileName,
    };
  }
}
