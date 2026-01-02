import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { WarehouseOperatorLocation } from './entities/warehouse-operator-location.entity';
import { WarehouseDocument } from '../warehouse/entities/warehouse-document.entity';
import { QueryOperatorLocationDto } from './dto/query-operator-location.dto';
import { UploadOperatorLocationCertificateDto } from './dto/upload-operator-location-certificate.dto';
import { ClamAVService } from '../clamav/clamav.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';

@Injectable()
export class WarehouseOperatorLocationService {
  private readonly logger = new Logger(WarehouseOperatorLocationService.name);

  constructor(
    @InjectRepository(WarehouseOperatorLocation)
    private readonly warehouseOperatorLocationRepository: Repository<WarehouseOperatorLocation>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    private readonly clamAVService: ClamAVService,
  ) {}

  async findAllOperatorLocations(userId: string, query: QueryOperatorLocationDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'ASC', search } = query;
    
    const whereCondition: any = {};
    
    if (search) {
      whereCondition.user = {
        firstName: ILike(`%${search}%`),
        lastName: ILike(`%${search}%`),
        email: ILike(`%${search}%`),
      };
    }

    if (query.status) {
      whereCondition.status = query.status;
    }

    const [locations, total] = await this.warehouseOperatorLocationRepository.findAndCount({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder as 'ASC' | 'DESC' },
      relations: { 
        user: true,
        warehouseOperator: true,
        warehouseLocation: true,
      },
    });

    return [locations, total];
  }

  async findOneOperatorLocation(id: string) {
    const location = await this.warehouseOperatorLocationRepository.findOne({
      where: { id },
      relations: { 
        user: true,
        warehouseOperator: true,
        warehouseLocation: true,
      },
    });

    if (!location) {
      throw new NotFoundException('Operator location not found');
    }

    // Fetch certificate document if exists
    const certificate = await this.warehouseDocumentRepository.findOne({
      where: {
        documentableType: 'WarehouseOperatorLocation',
        documentableId: id,
        documentType: 'operator-location-certificate',
      },
    });

    return {
      ...location,
      certificate: certificate ? {
        id: certificate.id,
        originalFileName: certificate.originalFileName,
        filePath: certificate.filePath,
        iv: certificate.iv,
        authTag: certificate.authTag,
        createdAt: certificate.createdAt,
      } : null,
    };
  }

  private convertBase64ToFile(
    base64String: string,
    fileName: string,
    mimeType?: string
  ): any {
    let base64Data = base64String;
    if (base64String.includes(',')) {
      base64Data = base64String.split(',')[1];
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new BadRequestException('Invalid base64 file data');
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`
      );
    }

    return {
      buffer,
      originalname: fileName,
      size: buffer.length,
      mimetype: mimeType || 'application/octet-stream',
    };
  }

  async uploadOperatorLocationCertificate(locationId: string, userId: string, dto: UploadOperatorLocationCertificateDto) {
    const { certificate, certificateFileName, certificateMimeType } = dto;

    const location = await this.warehouseOperatorLocationRepository.findOne({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Operator location not found');
    }

    const file = this.convertBase64ToFile(certificate, certificateFileName, certificateMimeType);

    const existingCertificate = await this.warehouseDocumentRepository.findOne({
      where: {
        documentableType: 'WarehouseOperatorLocation',
        documentableId: locationId,
        documentType: 'operator-location-certificate',
      },
    });

    if (existingCertificate) {
      try {
        const fullPath = path.join(process.cwd(), 'uploads', path.basename(existingCertificate.filePath));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        console.error('Error deleting old certificate file:', error);
      }
      await this.warehouseDocumentRepository.remove(existingCertificate);
    }

    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type '${fileExtension}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
      );
    }

    const isMandatory = this.clamAVService.getScanMandatory();
    if(isMandatory) {
      try {
        this.logger.log(`🔍 Scanning file with ClamAV: ${file.originalname}`);
        const scanResult = await this.clamAVService.scanBuffer(
          file.buffer,
          file.originalname,
        );
  
        if (scanResult.isInfected) {
          this.logger.warn(
            `🚨 Infected file detected: ${file.originalname}, Viruses: ${scanResult.viruses.join(', ')}`,
          );
          throw new BadRequestException(
            `File is infected with malware: ${scanResult.viruses.join(', ')}. Upload rejected.`,
          );
        }
  
        this.logger.log(`✅ File passed ClamAV scan: ${file.originalname}`);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        
        if (isMandatory) {
          this.logger.error(
            `ClamAV scan failed for ${file.originalname}: ${error.message}`,
            error.stack,
          );
          throw new BadRequestException(
            `Virus scanning unavailable: ${error.message}. Upload blocked due to mandatory scanning.`,
          );
        } else {
          this.logger.warn(
            `ClamAV scan failed for ${file.originalname}: ${error.message}. Bypassing scan and allowing upload.`,
            error.stack,
          );
        }
      }
    }

    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, sanitizedFilename);
    const documentPath = `/uploads/${sanitizedFilename}`;

    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);

    await fs.promises.writeFile(filePath, encrypted);

    const mimeType = file.mimetype || 'application/octet-stream';

    const document = this.warehouseDocumentRepository.create({
      userId,
      documentableType: 'WarehouseOperatorLocation',
      documentableId: locationId,
      documentType: 'operator-location-certificate',
      originalFileName: file.originalname,
      filePath: documentPath,
      mimeType,
      iv,
      authTag,
      isActive: true,
    });

    const savedDocument = await this.warehouseDocumentRepository.save(document);

    return {
      id: savedDocument.id,
      filePath: savedDocument.filePath,
      originalFileName: savedDocument.originalFileName,
      mimeType: savedDocument.mimeType,
      createdAt: savedDocument.createdAt,
    };
  }

  async downloadOperatorLocationCertificate(id: string) {
    const location = await this.warehouseOperatorLocationRepository.findOne({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException('Operator location not found');
    }

    const certificate = await this.warehouseDocumentRepository.findOne({
      where: {
        documentableType: 'WarehouseOperatorLocation',
        documentableId: id,
        documentType: 'operator-location-certificate',
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const fullPath = path.join(process.cwd(), 'uploads', path.basename(certificate.filePath));
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Certificate file not found on disk');
    }

    const encrypted = fs.readFileSync(fullPath);

    let decryptedBuffer: Buffer;
    if (certificate.iv && certificate.authTag) {
      try {
        decryptedBuffer = decryptBuffer(encrypted, certificate.iv, certificate.authTag);
      } catch (error: any) {
        throw new BadRequestException(`Failed to decrypt certificate: ${error.message}`);
      }
    } else {
      decryptedBuffer = encrypted;
    }

    const mimeType = certificate.mimeType || 'application/octet-stream';
    const base64Data = decryptedBuffer.toString('base64');
    const base64WithPrefix = `data:${mimeType};base64,${base64Data}`;

    return {
      certificate: base64WithPrefix,
      mimeType,
      filename: certificate.originalFileName,
    };
  }

  async deleteOperatorLocationCertificate(id: string) {
    const location = await this.warehouseOperatorLocationRepository.findOne({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException('Operator location not found');
    }

    const certificate = await this.warehouseDocumentRepository.findOne({
      where: {
        documentableType: 'WarehouseOperatorLocation',
        documentableId: id,
        documentType: 'operator-location-certificate',
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    // Delete file from disk
    try {
      const fullPath = path.join(process.cwd(), 'uploads', path.basename(certificate.filePath));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting certificate file:', error);
    }

    // Delete record
    await this.warehouseDocumentRepository.remove(certificate);

    return { message: 'Certificate deleted successfully' };
  }
}
