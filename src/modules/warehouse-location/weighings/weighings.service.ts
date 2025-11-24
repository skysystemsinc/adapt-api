import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';
import { Weighing } from './entities/weighing.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { WarehouseDocument } from '../../warehouse/entities/warehouse-document.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WeighingsService {
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(Weighing)
    private readonly weighingRepository: Repository<Weighing>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
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

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

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
      isActive: true,
    });

    return this.warehouseDocumentRepository.save(document);
  }

  /**
   * Get weighing by warehouse location ID
   */
  async findByWarehouseLocationId(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    const weighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    return weighing;
  }

  /**
   * Create or update weighing by warehouse location ID
   */
  async create(
    warehouseLocationId: string,
    createWeighingDto: CreateWeighingDto,
    userId: string,
    weighbridgeCalibrationCertificateFile: any
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Weighing can only be added while application is in draft status');
    }

    // Validate that file is provided
    if (!weighbridgeCalibrationCertificateFile) {
      throw new BadRequestException('Weighbridge calibration certificate file is required');
    }

    const existingWeighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    // Remove file field from DTO before saving
    const { weighbridgeCalibrationCertificate, ...weighingData } = createWeighingDto;

    if (existingWeighing) {
      Object.assign(existingWeighing, weighingData);
      const savedWeighing = await this.weighingRepository.save(existingWeighing);

      // Upload and link the certificate file
      const documentResult = await this.uploadWarehouseDocument(
        weighbridgeCalibrationCertificateFile,
        userId,
        'Weighing',
        savedWeighing.id,
        'weighbridgeCalibrationCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedWeighing.weighbridgeCalibrationCertificate = certificateDocument;
        await this.weighingRepository.save(savedWeighing);
      }

      return savedWeighing;
    }

    const weighing = this.weighingRepository.create({
      warehouseLocationId,
      ...weighingData,
    });

    const savedWeighing = await this.weighingRepository.save(weighing);

    // Upload and link the certificate file
    const documentResult = await this.uploadWarehouseDocument(
      weighbridgeCalibrationCertificateFile,
      userId,
      'Weighing',
      savedWeighing.id,
      'weighbridgeCalibrationCertificate'
    );

    const certificateDocument = await this.warehouseDocumentRepository.findOne({
      where: { id: documentResult.id }
    });

    if (certificateDocument) {
      savedWeighing.weighbridgeCalibrationCertificate = certificateDocument;
      await this.weighingRepository.save(savedWeighing);
    }

    await this.warehouseLocationRepository.update(warehouseLocationId, {
      weighing: savedWeighing,
    });

    return savedWeighing;
  }

  /**
   * Update weighing by warehouse location ID
   */
  async updateByWarehouseLocationId(
    warehouseLocationId: string,
    updateWeighingDto: CreateWeighingDto,
    userId: string,
    weighbridgeCalibrationCertificateFile?: any
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location application not found');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Weighing can only be updated while application is in draft status');
    }

    const weighing = await this.weighingRepository.findOne({
      where: { warehouseLocationId },
      relations: ['weighbridgeCalibrationCertificate'],
    });

    if (!weighing) {
      throw new NotFoundException('Weighing not found for this application');
    }

    // Remove file field from DTO before saving
    const { weighbridgeCalibrationCertificate, ...weighingData } = updateWeighingDto;

    Object.assign(weighing, weighingData);
    const savedWeighing = await this.weighingRepository.save(weighing);

    // Handle file upload if provided
    if (weighbridgeCalibrationCertificateFile) {
      const documentResult = await this.uploadWarehouseDocument(
        weighbridgeCalibrationCertificateFile,
        userId,
        'Weighing',
        savedWeighing.id,
        'weighbridgeCalibrationCertificate'
      );

      const certificateDocument = await this.warehouseDocumentRepository.findOne({
        where: { id: documentResult.id }
      });

      if (certificateDocument) {
        savedWeighing.weighbridgeCalibrationCertificate = certificateDocument;
        await this.weighingRepository.save(savedWeighing);
      }
    } else {
      // Ensure existing certificate is preserved (required field)
      if (!weighing.weighbridgeCalibrationCertificate) {
        throw new BadRequestException('Weighbridge calibration certificate is required');
      }
      // Keep existing certificate if no new file is provided
      savedWeighing.weighbridgeCalibrationCertificate = weighing.weighbridgeCalibrationCertificate;
      await this.weighingRepository.save(savedWeighing);
    }

    return savedWeighing;
  }

  findAll() {
    return `This action returns all weighings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} weighing`;
  }

  update(id: number, updateWeighingDto: UpdateWeighingDto) {
    return `This action updates a #${id} weighing`;
  }

  remove(id: number) {
    return `This action removes a #${id} weighing`;
  }
}
