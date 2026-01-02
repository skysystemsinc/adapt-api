import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CreateWarehouseLocationChecklistDto } from '../dto/create-warehouse-location-checklist.dto';
import { WarehouseLocationChecklistEntity } from '../entities/warehouse-location-checklist.entity';
import { WarehouseLocation, WarehouseLocationStatus } from '../entities/warehouse-location.entity';
import { OwnershipLegalDocumentsEntity } from '../entities/checklist/ownership-legal-documents.entity';
import { HumanResourcesKeyEntity } from '../entities/checklist/human-resources-key.entity';
import { LocationRiskEntity } from '../entities/checklist/location-risk.entity';
import { SecurityPerimeterEntity } from '../entities/checklist/security-perimeter.entity';
import { InfrastructureUtilitiesEntity } from '../entities/checklist/infrastructure-utilities.entity';
import { StorageFacilitiesEntity } from '../entities/checklist/storage-facilities.entity';
import { RegistrationFeeChecklistEntity } from '../../warehouse/entities/checklist/registration-fee.entity';
import { DeclarationChecklistEntity } from '../../warehouse/entities/checklist/declaration.entity';
import { WarehouseDocument } from '../../warehouse/entities/warehouse-document.entity';
import { ClamAVService } from '../../clamav/clamav.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { encryptBuffer, decryptBuffer } from 'src/common/utils/helper.utils';
import { Assignment, AssignmentLevel, AssignmentStatus } from '../../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../../warehouse/operator/assignment/entities/assignment-section.entity';
import { OwnershipLegalDocumentsHistoryEntity } from '../entities/checklist/ownership-legal-documents-history.entity';
import { HumanResourcesKeyHistoryEntity } from '../entities/checklist/human-resources-key-history.entity';
import { LocationRiskHistoryEntity } from '../entities/checklist/location-risk-history.entity';
import { SecurityPerimeterHistoryEntity } from '../entities/checklist/security-perimeter-history.entity';
import { InfrastructureUtilitiesHistoryEntity } from '../entities/checklist/infrastructure-utilities-history.entity';
import { StorageFacilitiesHistoryEntity } from '../entities/checklist/storage-facilities-history.entity';
import { WarehouseLocationService } from '../warehouse-location.service';
import { RegistrationFeeChecklistHistoryEntity } from 'src/modules/warehouse/entities/checklist/registration-fee-history.entity';
import { DeclarationChecklistHistoryEntity } from 'src/modules/warehouse/entities/checklist/declaration-history.entity';

@Injectable()
export class WarehouseLocationChecklistService {
  private readonly logger = new Logger(WarehouseLocationChecklistService.name);
  private readonly uploadDir = 'uploads';

  constructor(
    @InjectRepository(WarehouseLocationChecklistEntity)
    private readonly warehouseLocationChecklistRepository: Repository<WarehouseLocationChecklistEntity>,
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    @InjectRepository(OwnershipLegalDocumentsEntity)
    private readonly ownershipLegalDocumentsRepository: Repository<OwnershipLegalDocumentsEntity>,
    @InjectRepository(OwnershipLegalDocumentsHistoryEntity)
    private readonly ownershipLegalDocumentsHistoryRepository: Repository<OwnershipLegalDocumentsHistoryEntity>,
    @InjectRepository(HumanResourcesKeyEntity)
    private readonly humanResourcesKeyRepository: Repository<HumanResourcesKeyEntity>,
    @InjectRepository(HumanResourcesKeyHistoryEntity)
    private readonly humanResourcesKeyHistoryRepository: Repository<HumanResourcesKeyHistoryEntity>,
    @InjectRepository(LocationRiskEntity)
    private readonly locationRiskRepository: Repository<LocationRiskEntity>,
    @InjectRepository(LocationRiskHistoryEntity)
    private readonly locationRiskHistoryRepository: Repository<LocationRiskHistoryEntity>,
    @InjectRepository(SecurityPerimeterEntity)
    private readonly securityPerimeterRepository: Repository<SecurityPerimeterEntity>,
    @InjectRepository(SecurityPerimeterHistoryEntity)
    private readonly securityPerimeterHistoryRepository: Repository<SecurityPerimeterHistoryEntity>,
    @InjectRepository(InfrastructureUtilitiesEntity)
    private readonly infrastructureUtilitiesRepository: Repository<InfrastructureUtilitiesEntity>,
    @InjectRepository(InfrastructureUtilitiesHistoryEntity)
    private readonly infrastructureUtilitiesHistoryRepository: Repository<InfrastructureUtilitiesHistoryEntity>,
    @InjectRepository(StorageFacilitiesEntity)
    private readonly storageFacilitiesRepository: Repository<StorageFacilitiesEntity>,
    @InjectRepository(StorageFacilitiesHistoryEntity)
    private readonly storageFacilitiesHistoryRepository: Repository<StorageFacilitiesHistoryEntity>,
    @InjectRepository(RegistrationFeeChecklistEntity)
    private readonly registrationFeeRepository: Repository<RegistrationFeeChecklistEntity>,
    @InjectRepository(DeclarationChecklistEntity)
    private readonly declarationRepository: Repository<DeclarationChecklistEntity>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    private readonly dataSource: DataSource,
    private readonly clamAVService: ClamAVService,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSection)
    private readonly assignmentSectionRepository: Repository<AssignmentSection>,
    @Inject(forwardRef(() => WarehouseLocationService))
    private readonly warehouseLocationService: WarehouseLocationService,
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

  private convertBase64ToFile(
    base64String: string,
    fileName: string,
    mimeType?: string
  ): any {
    // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
    let base64Data = base64String;
    if (base64String.includes(',')) {
      base64Data = base64String.split(',')[1];
    }

    // Decode base64 to buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new BadRequestException('Invalid base64 file data');
    }

    // Validate file size (10MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      throw new BadRequestException(
        `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB`
      );
    }

    // Create file-like object that matches Multer file structure
    return {
      buffer,
      originalname: fileName,
      size: buffer.length,
      mimetype: mimeType || 'application/octet-stream',
    };
  }

  async uploadWarehouseDocument(
    file: any,
    userId: string,
    documentableType: string,
    documentableId: string,
    documentType: string,
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

    const isMandatory = this.clamAVService.getScanMandatory();
    if(isMandatory) {
      // Scan file with ClamAV before processing
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
          // Always reject infected files, regardless of CLAMAV_SCAN setting
          throw error;
        }
        
        // Handle ClamAV service failures (unavailable, timeout, etc.)
        
        if (isMandatory) {
          // CLAMAV_SCAN=true: Block upload if scan fails
          this.logger.error(
            `ClamAV scan failed for ${file.originalname}: ${error.message}`,
            error.stack,
          );
          throw new BadRequestException(
            `Virus scanning unavailable: ${error.message}. Upload blocked due to mandatory scanning.`,
          );
        } else {
          // CLAMAV_SCAN=false: Log warning but allow upload (bypass on failure)
          this.logger.warn(
            `ClamAV scan failed for ${file.originalname}: ${error.message}. Bypassing scan and allowing upload.`,
            error.stack,
          );
        }
      }
    }

    const sanitizedFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, sanitizedFilename);
    const documentPath = `/uploads/${sanitizedFilename}`;

    // Encrypt file before saving
    const { encrypted, iv, authTag } = encryptBuffer(file.buffer);

    // Save encrypted file to disk
    await fs.writeFile(filePath, encrypted);

    const mimeType = file.mimetype || 'application/octet-stream';

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

    const savedDocument = await this.warehouseDocumentRepository.save(document);

    return {
      id: savedDocument.id,
      filePath: savedDocument.filePath,
      originalFileName: savedDocument.originalFileName,
      mimeType: savedDocument.mimeType,
    };
  }

  private async uploadChecklistFiles(
    files: any,
    userId: string,
    warehouseLocationId: string,
  ): Promise<Record<string, string>> {
    const uploadedDocumentIds: Record<string, string> = {};
    const fileConfigs = [
      // Ownership & Legal Documents
      { key: 'ownershipDeedFile', type: 'OwnershipLegalDocumentsChecklist' },
      { key: 'mutationDeedFile', type: 'OwnershipLegalDocumentsChecklist' },
      { key: 'nocNecFile', type: 'OwnershipLegalDocumentsChecklist' },
      { key: 'factoryLayoutFile', type: 'OwnershipLegalDocumentsChecklist' },
      { key: 'leaseAgreementFile', type: 'OwnershipLegalDocumentsChecklist' },
      { key: 'propertyWarrantyFile', type: 'OwnershipLegalDocumentsChecklist' },
      { key: 'agreementUndertakingFile', type: 'OwnershipLegalDocumentsChecklist' },
      // Human Resources Key
      { key: 'qcPersonnelFile', type: 'HumanResourcesKeyChecklist' },
      { key: 'warehouseSupervisorFile', type: 'HumanResourcesKeyChecklist' },
      { key: 'dataEntryOperatorFile', type: 'HumanResourcesKeyChecklist' },
      // Location & Risk
      { key: 'warehouseOutsideFloodingAreaFile', type: 'LocationRiskChecklist' },
      // Security & Perimeter
      { key: 'securedBoundaryWallFile', type: 'SecurityPerimeterChecklist' },
      { key: 'reinforcedBarbedWireFile', type: 'SecurityPerimeterChecklist' },
      { key: 'fullyGatedFile', type: 'SecurityPerimeterChecklist' },
      { key: 'securityGuards24x7File', type: 'SecurityPerimeterChecklist' },
      { key: 'cctvCamerasFile', type: 'SecurityPerimeterChecklist' },
      // Infrastructure & Utilities
      { key: 'functionalWeighbridgeFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'samplingTestingAreaFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'calibratedInstrumentsFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'functionalOfficeFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'operationalToiletsFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'electricityGasUtilitiesFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'backupGeneratorFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'adequateResidentialArrangementsFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'axialAerationFansFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'ventsExhaustFansFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'technicalDrawingFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'dryingFacilityFile', type: 'InfrastructureUtilitiesChecklist' },
      { key: 'temperatureSensorCablesFile', type: 'InfrastructureUtilitiesChecklist' },
      // Storage Facilities
      { key: 'securedDoorsFile', type: 'StorageFacilitiesChecklist' },
      { key: 'plasteredFlooringFile', type: 'StorageFacilitiesChecklist' },
      { key: 'plasteredWallsFile', type: 'StorageFacilitiesChecklist' },
      { key: 'intactCeilingFile', type: 'StorageFacilitiesChecklist' },
      { key: 'functionalWindowsFile', type: 'StorageFacilitiesChecklist' },
      { key: 'protectiveNettingFile', type: 'StorageFacilitiesChecklist' },
      { key: 'functionalExhaustFansFile', type: 'StorageFacilitiesChecklist' },
      { key: 'freeFromPestsFile', type: 'StorageFacilitiesChecklist' },
      { key: 'fireSafetyMeasuresFile', type: 'StorageFacilitiesChecklist' },
      // Registration Fee
      { key: 'bankPaymentSlip', type: 'RegistrationFeeChecklist' },
    ];

    for (const config of fileConfigs) {
      const fileArray = files?.[config.key];
      if (fileArray && fileArray.length > 0) {
        const doc = await this.uploadWarehouseDocument(
          fileArray[0],
          userId,
          config.type,
          warehouseLocationId,
          config.key,
        );
        uploadedDocumentIds[config.key] = doc.id;
      }
    }

    return uploadedDocumentIds;
  }

  /**
   * Process base64 files in DTO: convert base64 strings to files, upload them, and replace with document IDs
   */
  private async processBase64FilesInDto(
    dto: CreateWarehouseLocationChecklistDto,
    userId: string,
    warehouseLocationId: string,
  ): Promise<void> {
    // Helper to process a single file field
    const processFileField = async (
      fileValue: string | undefined,
      fileName: string | undefined,
      mimeType: string | undefined,
      documentType: string,
      setter: (docId: string) => void,
    ): Promise<void> => {
      if (!fileValue || fileValue.trim() === '') {
        return;
      }

      // Check if it's base64 (starts with "data:" or is a very long string without dashes)
      const isBase64 = fileValue.startsWith('data:') || 
                      (!fileValue.includes('-') && fileValue.length > 50);

      if (isBase64) {
        if (!fileName) {
          throw new BadRequestException(`${documentType} fileName is required when file is base64`);
        }

        // Convert base64 to file
        const file = this.convertBase64ToFile(fileValue, fileName, mimeType);

        // Upload the file
        const doc = await this.uploadWarehouseDocument(
          file,
          userId,
          documentType,
          warehouseLocationId,
          documentType,
        );

        // Replace base64 string with document ID
        setter(doc.id);
      }
      // If it's already a document ID (UUID), keep it as is
    };

    // Process all file fields
    // Ownership & Legal Documents
    await processFileField(
      dto.ownershipLegalDocuments.ownershipDeedFile,
      dto.ownershipLegalDocuments.ownershipDeedFileName,
      dto.ownershipLegalDocuments.ownershipDeedFileMimeType,
      'OwnershipLegalDocumentsChecklist',
      (id) => { dto.ownershipLegalDocuments.ownershipDeedFile = id; },
    );
    await processFileField(
      dto.ownershipLegalDocuments.mutationDeedFile,
      dto.ownershipLegalDocuments.mutationDeedFileName,
      dto.ownershipLegalDocuments.mutationDeedFileMimeType,
      'OwnershipLegalDocumentsChecklist',
      (id) => { dto.ownershipLegalDocuments.mutationDeedFile = id; },
    );
    await processFileField(
      dto.ownershipLegalDocuments.nocNecFile,
      dto.ownershipLegalDocuments.nocNecFileName,
      dto.ownershipLegalDocuments.nocNecFileMimeType,
      'OwnershipLegalDocumentsChecklist',
      (id) => { dto.ownershipLegalDocuments.nocNecFile = id; },
    );
    await processFileField(
      dto.ownershipLegalDocuments.factoryLayoutFile,
      dto.ownershipLegalDocuments.factoryLayoutFileName,
      dto.ownershipLegalDocuments.factoryLayoutFileMimeType,
      'OwnershipLegalDocumentsChecklist',
      (id) => { dto.ownershipLegalDocuments.factoryLayoutFile = id; },
    );
    await processFileField(
      dto.ownershipLegalDocuments.leaseAgreementFile,
      dto.ownershipLegalDocuments.leaseAgreementFileName,
      dto.ownershipLegalDocuments.leaseAgreementFileMimeType,
      'OwnershipLegalDocumentsChecklist',
      (id) => { dto.ownershipLegalDocuments.leaseAgreementFile = id; },
    );
    await processFileField(
      dto.ownershipLegalDocuments.propertyWarrantyFile,
      dto.ownershipLegalDocuments.propertyWarrantyFileName,
      dto.ownershipLegalDocuments.propertyWarrantyFileMimeType,
      'OwnershipLegalDocumentsChecklist',
      (id) => { dto.ownershipLegalDocuments.propertyWarrantyFile = id; },
    );
    await processFileField(
      dto.ownershipLegalDocuments.agreementUndertakingFile,
      dto.ownershipLegalDocuments.agreementUndertakingFileName,
      dto.ownershipLegalDocuments.agreementUndertakingFileMimeType,
      'OwnershipLegalDocumentsChecklist',
      (id) => { dto.ownershipLegalDocuments.agreementUndertakingFile = id; },
    );

    // Human Resources Key
    await processFileField(
      dto.humanResourcesKey.qcPersonnelFile,
      dto.humanResourcesKey.qcPersonnelFileName,
      dto.humanResourcesKey.qcPersonnelFileMimeType,
      'HumanResourcesKeyChecklist',
      (id) => { dto.humanResourcesKey.qcPersonnelFile = id; },
    );
    await processFileField(
      dto.humanResourcesKey.warehouseSupervisorFile,
      dto.humanResourcesKey.warehouseSupervisorFileName,
      dto.humanResourcesKey.warehouseSupervisorFileMimeType,
      'HumanResourcesKeyChecklist',
      (id) => { dto.humanResourcesKey.warehouseSupervisorFile = id; },
    );
    await processFileField(
      dto.humanResourcesKey.dataEntryOperatorFile,
      dto.humanResourcesKey.dataEntryOperatorFileName,
      dto.humanResourcesKey.dataEntryOperatorFileMimeType,
      'HumanResourcesKeyChecklist',
      (id) => { dto.humanResourcesKey.dataEntryOperatorFile = id; },
    );

    // Location & Risk
    await processFileField(
      dto.locationRisk.warehouseOutsideFloodingAreaFile,
      dto.locationRisk.warehouseOutsideFloodingAreaFileName,
      dto.locationRisk.warehouseOutsideFloodingAreaFileMimeType,
      'LocationRiskChecklist',
      (id) => { dto.locationRisk.warehouseOutsideFloodingAreaFile = id; },
    );

    // Security & Perimeter
    await processFileField(
      dto.securityPerimeter.securedBoundaryWallFile,
      dto.securityPerimeter.securedBoundaryWallFileName,
      dto.securityPerimeter.securedBoundaryWallFileMimeType,
      'SecurityPerimeterChecklist',
      (id) => { dto.securityPerimeter.securedBoundaryWallFile = id; },
    );
    await processFileField(
      dto.securityPerimeter.reinforcedBarbedWireFile,
      dto.securityPerimeter.reinforcedBarbedWireFileName,
      dto.securityPerimeter.reinforcedBarbedWireFileMimeType,
      'SecurityPerimeterChecklist',
      (id) => { dto.securityPerimeter.reinforcedBarbedWireFile = id; },
    );
    await processFileField(
      dto.securityPerimeter.fullyGatedFile,
      dto.securityPerimeter.fullyGatedFileName,
      dto.securityPerimeter.fullyGatedFileMimeType,
      'SecurityPerimeterChecklist',
      (id) => { dto.securityPerimeter.fullyGatedFile = id; },
    );
    await processFileField(
      dto.securityPerimeter.securityGuards24x7File,
      dto.securityPerimeter.securityGuards24x7FileName,
      dto.securityPerimeter.securityGuards24x7FileMimeType,
      'SecurityPerimeterChecklist',
      (id) => { dto.securityPerimeter.securityGuards24x7File = id; },
    );
    await processFileField(
      dto.securityPerimeter.cctvCamerasFile,
      dto.securityPerimeter.cctvCamerasFileName,
      dto.securityPerimeter.cctvCamerasFileMimeType,
      'SecurityPerimeterChecklist',
      (id) => { dto.securityPerimeter.cctvCamerasFile = id; },
    );

    // Infrastructure & Utilities
    await processFileField(
      dto.infrastructureUtilities.functionalWeighbridgeFile,
      dto.infrastructureUtilities.functionalWeighbridgeFileName,
      dto.infrastructureUtilities.functionalWeighbridgeFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.functionalWeighbridgeFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.samplingTestingAreaFile,
      dto.infrastructureUtilities.samplingTestingAreaFileName,
      dto.infrastructureUtilities.samplingTestingAreaFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.samplingTestingAreaFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.calibratedInstrumentsFile,
      dto.infrastructureUtilities.calibratedInstrumentsFileName,
      dto.infrastructureUtilities.calibratedInstrumentsFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.calibratedInstrumentsFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.functionalOfficeFile,
      dto.infrastructureUtilities.functionalOfficeFileName,
      dto.infrastructureUtilities.functionalOfficeFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.functionalOfficeFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.operationalToiletsFile,
      dto.infrastructureUtilities.operationalToiletsFileName,
      dto.infrastructureUtilities.operationalToiletsFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.operationalToiletsFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.electricityGasUtilitiesFile,
      dto.infrastructureUtilities.electricityGasUtilitiesFileName,
      dto.infrastructureUtilities.electricityGasUtilitiesFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.electricityGasUtilitiesFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.backupGeneratorFile,
      dto.infrastructureUtilities.backupGeneratorFileName,
      dto.infrastructureUtilities.backupGeneratorFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.backupGeneratorFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.adequateResidentialArrangementsFile,
      dto.infrastructureUtilities.adequateResidentialArrangementsFileName,
      dto.infrastructureUtilities.adequateResidentialArrangementsFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.adequateResidentialArrangementsFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.axialAerationFansFile,
      dto.infrastructureUtilities.axialAerationFansFileName,
      dto.infrastructureUtilities.axialAerationFansFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.axialAerationFansFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.ventsExhaustFansFile,
      dto.infrastructureUtilities.ventsExhaustFansFileName,
      dto.infrastructureUtilities.ventsExhaustFansFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.ventsExhaustFansFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.technicalDrawingFile,
      dto.infrastructureUtilities.technicalDrawingFileName,
      dto.infrastructureUtilities.technicalDrawingFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.technicalDrawingFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.dryingFacilityFile,
      dto.infrastructureUtilities.dryingFacilityFileName,
      dto.infrastructureUtilities.dryingFacilityFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.dryingFacilityFile = id; },
    );
    await processFileField(
      dto.infrastructureUtilities.temperatureSensorCablesFile,
      dto.infrastructureUtilities.temperatureSensorCablesFileName,
      dto.infrastructureUtilities.temperatureSensorCablesFileMimeType,
      'InfrastructureUtilitiesChecklist',
      (id) => { dto.infrastructureUtilities.temperatureSensorCablesFile = id; },
    );

    // Storage Facilities
    await processFileField(
      dto.storageFacilities.securedDoorsFile,
      dto.storageFacilities.securedDoorsFileName,
      dto.storageFacilities.securedDoorsFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.securedDoorsFile = id; },
    );
    await processFileField(
      dto.storageFacilities.plasteredFlooringFile,
      dto.storageFacilities.plasteredFlooringFileName,
      dto.storageFacilities.plasteredFlooringFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.plasteredFlooringFile = id; },
    );
    await processFileField(
      dto.storageFacilities.plasteredWallsFile,
      dto.storageFacilities.plasteredWallsFileName,
      dto.storageFacilities.plasteredWallsFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.plasteredWallsFile = id; },
    );
    await processFileField(
      dto.storageFacilities.intactCeilingFile,
      dto.storageFacilities.intactCeilingFileName,
      dto.storageFacilities.intactCeilingFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.intactCeilingFile = id; },
    );
    await processFileField(
      dto.storageFacilities.functionalWindowsFile,
      dto.storageFacilities.functionalWindowsFileName,
      dto.storageFacilities.functionalWindowsFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.functionalWindowsFile = id; },
    );
    await processFileField(
      dto.storageFacilities.protectiveNettingFile,
      dto.storageFacilities.protectiveNettingFileName,
      dto.storageFacilities.protectiveNettingFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.protectiveNettingFile = id; },
    );
    await processFileField(
      dto.storageFacilities.functionalExhaustFansFile,
      dto.storageFacilities.functionalExhaustFansFileName,
      dto.storageFacilities.functionalExhaustFansFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.functionalExhaustFansFile = id; },
    );
    await processFileField(
      dto.storageFacilities.freeFromPestsFile,
      dto.storageFacilities.freeFromPestsFileName,
      dto.storageFacilities.freeFromPestsFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.freeFromPestsFile = id; },
    );
    await processFileField(
      dto.storageFacilities.fireSafetyMeasuresFile,
      dto.storageFacilities.fireSafetyMeasuresFileName,
      dto.storageFacilities.fireSafetyMeasuresFileMimeType,
      'StorageFacilitiesChecklist',
      (id) => { dto.storageFacilities.fireSafetyMeasuresFile = id; },
    );

    // Registration Fee
    await processFileField(
      dto.registrationFee.bankPaymentSlip,
      dto.registrationFee.bankPaymentSlipFileName,
      dto.registrationFee.bankPaymentSlipMimeType,
      'RegistrationFeeChecklist',
      (id) => { dto.registrationFee.bankPaymentSlip = id; },
    );
  }

  private mapUploadedDocumentsToDto(
    dto: CreateWarehouseLocationChecklistDto,
    uploadedDocumentIds: Record<string, string>,
  ): void {
    // Ownership & Legal Documents
    if (uploadedDocumentIds.ownershipDeedFile) {
      dto.ownershipLegalDocuments.ownershipDeedFile = uploadedDocumentIds.ownershipDeedFile;
    }
    if (uploadedDocumentIds.mutationDeedFile) {
      dto.ownershipLegalDocuments.mutationDeedFile = uploadedDocumentIds.mutationDeedFile;
    }
    if (uploadedDocumentIds.nocNecFile) {
      dto.ownershipLegalDocuments.nocNecFile = uploadedDocumentIds.nocNecFile;
    }
    if (uploadedDocumentIds.factoryLayoutFile) {
      dto.ownershipLegalDocuments.factoryLayoutFile = uploadedDocumentIds.factoryLayoutFile;
    }
    if (uploadedDocumentIds.leaseAgreementFile) {
      dto.ownershipLegalDocuments.leaseAgreementFile = uploadedDocumentIds.leaseAgreementFile;
    }
    if (uploadedDocumentIds.propertyWarrantyFile) {
      dto.ownershipLegalDocuments.propertyWarrantyFile = uploadedDocumentIds.propertyWarrantyFile;
    }
    if (uploadedDocumentIds.agreementUndertakingFile) {
      dto.ownershipLegalDocuments.agreementUndertakingFile = uploadedDocumentIds.agreementUndertakingFile;
    }
    // Human Resources Key
    if (uploadedDocumentIds.qcPersonnelFile) {
      dto.humanResourcesKey.qcPersonnelFile = uploadedDocumentIds.qcPersonnelFile;
    }
    if (uploadedDocumentIds.warehouseSupervisorFile) {
      dto.humanResourcesKey.warehouseSupervisorFile = uploadedDocumentIds.warehouseSupervisorFile;
    }
    if (uploadedDocumentIds.dataEntryOperatorFile) {
      dto.humanResourcesKey.dataEntryOperatorFile = uploadedDocumentIds.dataEntryOperatorFile;
    }
    // Location & Risk
    if (uploadedDocumentIds.warehouseOutsideFloodingAreaFile) {
      dto.locationRisk.warehouseOutsideFloodingAreaFile = uploadedDocumentIds.warehouseOutsideFloodingAreaFile;
    }
    // Security & Perimeter
    if (uploadedDocumentIds.securedBoundaryWallFile) {
      dto.securityPerimeter.securedBoundaryWallFile = uploadedDocumentIds.securedBoundaryWallFile;
    }
    if (uploadedDocumentIds.reinforcedBarbedWireFile) {
      dto.securityPerimeter.reinforcedBarbedWireFile = uploadedDocumentIds.reinforcedBarbedWireFile;
    }
    if (uploadedDocumentIds.fullyGatedFile) {
      dto.securityPerimeter.fullyGatedFile = uploadedDocumentIds.fullyGatedFile;
    }
    if (uploadedDocumentIds.securityGuards24x7File) {
      dto.securityPerimeter.securityGuards24x7File = uploadedDocumentIds.securityGuards24x7File;
    }
    if (uploadedDocumentIds.cctvCamerasFile) {
      dto.securityPerimeter.cctvCamerasFile = uploadedDocumentIds.cctvCamerasFile;
    }
    // Infrastructure & Utilities
    if (uploadedDocumentIds.functionalWeighbridgeFile) {
      dto.infrastructureUtilities.functionalWeighbridgeFile = uploadedDocumentIds.functionalWeighbridgeFile;
    }
    if (uploadedDocumentIds.samplingTestingAreaFile) {
      dto.infrastructureUtilities.samplingTestingAreaFile = uploadedDocumentIds.samplingTestingAreaFile;
    }
    if (uploadedDocumentIds.calibratedInstrumentsFile) {
      dto.infrastructureUtilities.calibratedInstrumentsFile = uploadedDocumentIds.calibratedInstrumentsFile;
    }
    if (uploadedDocumentIds.functionalOfficeFile) {
      dto.infrastructureUtilities.functionalOfficeFile = uploadedDocumentIds.functionalOfficeFile;
    }
    if (uploadedDocumentIds.operationalToiletsFile) {
      dto.infrastructureUtilities.operationalToiletsFile = uploadedDocumentIds.operationalToiletsFile;
    }
    if (uploadedDocumentIds.electricityGasUtilitiesFile) {
      dto.infrastructureUtilities.electricityGasUtilitiesFile = uploadedDocumentIds.electricityGasUtilitiesFile;
    }
    if (uploadedDocumentIds.backupGeneratorFile) {
      dto.infrastructureUtilities.backupGeneratorFile = uploadedDocumentIds.backupGeneratorFile;
    }
    if (uploadedDocumentIds.adequateResidentialArrangementsFile) {
      dto.infrastructureUtilities.adequateResidentialArrangementsFile = uploadedDocumentIds.adequateResidentialArrangementsFile;
    }
    if (uploadedDocumentIds.axialAerationFansFile) {
      dto.infrastructureUtilities.axialAerationFansFile = uploadedDocumentIds.axialAerationFansFile;
    }
    if (uploadedDocumentIds.ventsExhaustFansFile) {
      dto.infrastructureUtilities.ventsExhaustFansFile = uploadedDocumentIds.ventsExhaustFansFile;
    }
    if (uploadedDocumentIds.technicalDrawingFile) {
      dto.infrastructureUtilities.technicalDrawingFile = uploadedDocumentIds.technicalDrawingFile;
    }
    if (uploadedDocumentIds.dryingFacilityFile) {
      dto.infrastructureUtilities.dryingFacilityFile = uploadedDocumentIds.dryingFacilityFile;
    }
    if (uploadedDocumentIds.temperatureSensorCablesFile) {
      dto.infrastructureUtilities.temperatureSensorCablesFile = uploadedDocumentIds.temperatureSensorCablesFile;
    }
    // Storage Facilities
    if (uploadedDocumentIds.securedDoorsFile) {
      dto.storageFacilities.securedDoorsFile = uploadedDocumentIds.securedDoorsFile;
    }
    if (uploadedDocumentIds.plasteredFlooringFile) {
      dto.storageFacilities.plasteredFlooringFile = uploadedDocumentIds.plasteredFlooringFile;
    }
    if (uploadedDocumentIds.plasteredWallsFile) {
      dto.storageFacilities.plasteredWallsFile = uploadedDocumentIds.plasteredWallsFile;
    }
    if (uploadedDocumentIds.intactCeilingFile) {
      dto.storageFacilities.intactCeilingFile = uploadedDocumentIds.intactCeilingFile;
    }
    if (uploadedDocumentIds.functionalWindowsFile) {
      dto.storageFacilities.functionalWindowsFile = uploadedDocumentIds.functionalWindowsFile;
    }
    if (uploadedDocumentIds.protectiveNettingFile) {
      dto.storageFacilities.protectiveNettingFile = uploadedDocumentIds.protectiveNettingFile;
    }
    if (uploadedDocumentIds.functionalExhaustFansFile) {
      dto.storageFacilities.functionalExhaustFansFile = uploadedDocumentIds.functionalExhaustFansFile;
    }
    if (uploadedDocumentIds.freeFromPestsFile) {
      dto.storageFacilities.freeFromPestsFile = uploadedDocumentIds.freeFromPestsFile;
    }
    if (uploadedDocumentIds.fireSafetyMeasuresFile) {
      dto.storageFacilities.fireSafetyMeasuresFile = uploadedDocumentIds.fireSafetyMeasuresFile;
    }
    // Registration Fee
    if (uploadedDocumentIds.bankPaymentSlip) {
      dto.registrationFee.bankPaymentSlip = uploadedDocumentIds.bankPaymentSlip;
    }
  }

  private validateChecklistFiles(dto: CreateWarehouseLocationChecklistDto): void {
    // Ownership & Legal Documents
    if (dto.ownershipLegalDocuments.ownershipDeed && !dto.ownershipLegalDocuments.ownershipDeedFile) {
      throw new BadRequestException('ownershipDeedFile is required when ownershipDeed is true');
    }
    if (dto.ownershipLegalDocuments.mutationDeed && !dto.ownershipLegalDocuments.mutationDeedFile) {
      throw new BadRequestException('mutationDeedFile is required when mutationDeed is true');
    }
    if (dto.ownershipLegalDocuments.nocNec && !dto.ownershipLegalDocuments.nocNecFile) {
      throw new BadRequestException('nocNecFile is required when nocNec is true');
    }
    if (dto.ownershipLegalDocuments.factoryLayout && !dto.ownershipLegalDocuments.factoryLayoutFile) {
      throw new BadRequestException('factoryLayoutFile is required when factoryLayout is true');
    }
    if (dto.ownershipLegalDocuments.leaseAgreement && !dto.ownershipLegalDocuments.leaseAgreementFile) {
      throw new BadRequestException('leaseAgreementFile is required when leaseAgreement is true');
    }
    if (dto.ownershipLegalDocuments.propertyWarranty && !dto.ownershipLegalDocuments.propertyWarrantyFile) {
      throw new BadRequestException('propertyWarrantyFile is required when propertyWarranty is true');
    }
    if (dto.ownershipLegalDocuments.agreementUndertaking && !dto.ownershipLegalDocuments.agreementUndertakingFile) {
      throw new BadRequestException('agreementUndertakingFile is required when agreementUndertaking is true');
    }
    // Human Resources Key
    if (dto.humanResourcesKey.qcPersonnel && !dto.humanResourcesKey.qcPersonnelFile) {
      throw new BadRequestException('qcPersonnelFile is required when qcPersonnel is true');
    }
    if (dto.humanResourcesKey.warehouseSupervisor && !dto.humanResourcesKey.warehouseSupervisorFile) {
      throw new BadRequestException('warehouseSupervisorFile is required when warehouseSupervisor is true');
    }
    if (dto.humanResourcesKey.dataEntryOperator && !dto.humanResourcesKey.dataEntryOperatorFile) {
      throw new BadRequestException('dataEntryOperatorFile is required when dataEntryOperator is true');
    }
    // Location & Risk
    if (dto.locationRisk.warehouseOutsideFloodingArea && !dto.locationRisk.warehouseOutsideFloodingAreaFile) {
      throw new BadRequestException('warehouseOutsideFloodingAreaFile is required when warehouseOutsideFloodingArea is true');
    }
    // Security & Perimeter
    if (dto.securityPerimeter.securedBoundaryWall && !dto.securityPerimeter.securedBoundaryWallFile) {
      throw new BadRequestException('securedBoundaryWallFile is required when securedBoundaryWall is true');
    }
    if (dto.securityPerimeter.reinforcedBarbedWire && !dto.securityPerimeter.reinforcedBarbedWireFile) {
      throw new BadRequestException('reinforcedBarbedWireFile is required when reinforcedBarbedWire is true');
    }
    if (dto.securityPerimeter.fullyGated && !dto.securityPerimeter.fullyGatedFile) {
      throw new BadRequestException('fullyGatedFile is required when fullyGated is true');
    }
    if (dto.securityPerimeter.securityGuards24x7 && !dto.securityPerimeter.securityGuards24x7File) {
      throw new BadRequestException('securityGuards24x7File is required when securityGuards24x7 is true');
    }
    if (dto.securityPerimeter.cctvCameras && !dto.securityPerimeter.cctvCamerasFile) {
      throw new BadRequestException('cctvCamerasFile is required when cctvCameras is true');
    }
    // Infrastructure & Utilities
    if (dto.infrastructureUtilities.functionalWeighbridge && !dto.infrastructureUtilities.functionalWeighbridgeFile) {
      throw new BadRequestException('functionalWeighbridgeFile is required when functionalWeighbridge is true');
    }
    if (dto.infrastructureUtilities.samplingTestingArea && !dto.infrastructureUtilities.samplingTestingAreaFile) {
      throw new BadRequestException('samplingTestingAreaFile is required when samplingTestingArea is true');
    }
    if (dto.infrastructureUtilities.calibratedInstruments && !dto.infrastructureUtilities.calibratedInstrumentsFile) {
      throw new BadRequestException('calibratedInstrumentsFile is required when calibratedInstruments is true');
    }
    if (dto.infrastructureUtilities.functionalOffice && !dto.infrastructureUtilities.functionalOfficeFile) {
      throw new BadRequestException('functionalOfficeFile is required when functionalOffice is true');
    }
    if (dto.infrastructureUtilities.operationalToilets && !dto.infrastructureUtilities.operationalToiletsFile) {
      throw new BadRequestException('operationalToiletsFile is required when operationalToilets is true');
    }
    if (dto.infrastructureUtilities.electricityGasUtilities && !dto.infrastructureUtilities.electricityGasUtilitiesFile) {
      throw new BadRequestException('electricityGasUtilitiesFile is required when electricityGasUtilities is true');
    }
    if (dto.infrastructureUtilities.backupGenerator && !dto.infrastructureUtilities.backupGeneratorFile) {
      throw new BadRequestException('backupGeneratorFile is required when backupGenerator is true');
    }
    if (dto.infrastructureUtilities.adequateResidentialArrangements && !dto.infrastructureUtilities.adequateResidentialArrangementsFile) {
      throw new BadRequestException('adequateResidentialArrangementsFile is required when adequateResidentialArrangements is true');
    }
    if (dto.infrastructureUtilities.axialAerationFans && !dto.infrastructureUtilities.axialAerationFansFile) {
      throw new BadRequestException('axialAerationFansFile is required when axialAerationFans is true');
    }
    if (dto.infrastructureUtilities.ventsExhaustFans && !dto.infrastructureUtilities.ventsExhaustFansFile) {
      throw new BadRequestException('ventsExhaustFansFile is required when ventsExhaustFans is true');
    }
    if (dto.infrastructureUtilities.technicalDrawing && !dto.infrastructureUtilities.technicalDrawingFile) {
      throw new BadRequestException('technicalDrawingFile is required when technicalDrawing is true');
    }
    if (dto.infrastructureUtilities.dryingFacility && !dto.infrastructureUtilities.dryingFacilityFile) {
      throw new BadRequestException('dryingFacilityFile is required when dryingFacility is true');
    }
    if (dto.infrastructureUtilities.temperatureSensorCables && !dto.infrastructureUtilities.temperatureSensorCablesFile) {
      throw new BadRequestException('temperatureSensorCablesFile is required when temperatureSensorCables is true');
    }
    // Storage Facilities
    if (dto.storageFacilities.securedDoors && !dto.storageFacilities.securedDoorsFile) {
      throw new BadRequestException('securedDoorsFile is required when securedDoors is true');
    }
    if (dto.storageFacilities.plasteredFlooring && !dto.storageFacilities.plasteredFlooringFile) {
      throw new BadRequestException('plasteredFlooringFile is required when plasteredFlooring is true');
    }
    if (dto.storageFacilities.plasteredWalls && !dto.storageFacilities.plasteredWallsFile) {
      throw new BadRequestException('plasteredWallsFile is required when plasteredWalls is true');
    }
    if (dto.storageFacilities.intactCeiling && !dto.storageFacilities.intactCeilingFile) {
      throw new BadRequestException('intactCeilingFile is required when intactCeiling is true');
    }
    if (dto.storageFacilities.functionalWindows && !dto.storageFacilities.functionalWindowsFile) {
      throw new BadRequestException('functionalWindowsFile is required when functionalWindows is true');
    }
    if (dto.storageFacilities.protectiveNetting && !dto.storageFacilities.protectiveNettingFile) {
      throw new BadRequestException('protectiveNettingFile is required when protectiveNetting is true');
    }
    if (dto.storageFacilities.functionalExhaustFans && !dto.storageFacilities.functionalExhaustFansFile) {
      throw new BadRequestException('functionalExhaustFansFile is required when functionalExhaustFans is true');
    }
    if (dto.storageFacilities.freeFromPests && !dto.storageFacilities.freeFromPestsFile) {
      throw new BadRequestException('freeFromPestsFile is required when freeFromPests is true');
    }
    if (dto.storageFacilities.fireSafetyMeasures && !dto.storageFacilities.fireSafetyMeasuresFile) {
      throw new BadRequestException('fireSafetyMeasuresFile is required when fireSafetyMeasures is true');
    }
    // Registration Fee
    if (!dto.registrationFee.bankPaymentSlip) {
      throw new BadRequestException('bankPaymentSlip is required');
    }
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

  private createAssignDocumentFunction(documentRepo: Repository<WarehouseDocument>, userId: string) {
    return async (
      documentId: string | undefined | null,
      documentableType: string,
      documentType: string,
      documentableId: string,
      oldDocumentId?: string | null,
    ) => {
      if (oldDocumentId && oldDocumentId !== documentId) {
        const oldDocument = await documentRepo.findOne({ where: { id: oldDocumentId } });
        if (oldDocument && oldDocument.documentableId === documentableId && oldDocument.documentType === documentType) {
          // Delete the old document instead of deactivating it
          await this.deleteWarehouseDocument(oldDocumentId);
        }
      }

      if (!documentId) return;

      const document = await documentRepo.findOne({ where: { id: documentId } });
      if (!document) {
        throw new NotFoundException('Document not found');
      }

      if (document.userId !== userId) {
        throw new BadRequestException('You are not allowed to use this document reference');
      }

      document.documentableType = documentableType;
      document.documentableId = documentableId;
      document.documentType = documentType;
      await documentRepo.save(document);
    };
  }

  private createBatchAssignDocumentsFunction(assignDocument: Function) {
    return async (
      documents: Array<{ id: string | undefined | null; type: string; documentType: string; entityId: string; oldId?: string | null }>,
    ) => {
      await Promise.all(
        documents.map((doc) => assignDocument(doc.id, doc.type, doc.documentType, doc.entityId, doc.oldId)),
      );
    };
  }

  async createWarehouseLocationChecklist(
    warehouseLocationId: string,
    dto: CreateWarehouseLocationChecklistDto,
    userId: string,
    submit: boolean = false,
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location not found. Please create a warehouse location first.');
    }

    if (warehouseLocation.status !== WarehouseLocationStatus.DRAFT) {
      throw new BadRequestException('Checklist can only be added while warehouse location is in draft status.');
    }

    if (!dto.id) {
      const existingChecklist = await this.warehouseLocationChecklistRepository.findOne({
        where: { warehouseLocationId: warehouseLocation.id },
      });

      if (existingChecklist) {
        throw new BadRequestException('Checklist already exists for this warehouse location. Please update instead of creating a new one.');
      }
    }

    // Process base64 files from DTO
    await this.processBase64FilesInDto(dto, userId, warehouseLocationId);
    this.validateChecklistFiles(dto);

    const savedChecklist = await this.dataSource.transaction(async (manager) => {
      const repos = {
        checklist: manager.getRepository(WarehouseLocationChecklistEntity),
        ownershipLegal: manager.getRepository(OwnershipLegalDocumentsEntity),
        humanResourcesKey: manager.getRepository(HumanResourcesKeyEntity),
        locationRisk: manager.getRepository(LocationRiskEntity),
        securityPerimeter: manager.getRepository(SecurityPerimeterEntity),
        infrastructureUtilities: manager.getRepository(InfrastructureUtilitiesEntity),
        storageFacilities: manager.getRepository(StorageFacilitiesEntity),
        registrationFee: manager.getRepository(RegistrationFeeChecklistEntity),
        declaration: manager.getRepository(DeclarationChecklistEntity),
        document: manager.getRepository(WarehouseDocument),
        warehouseLocation: manager.getRepository(WarehouseLocation),
      };

      const assignDocument = this.createAssignDocumentFunction(repos.document, userId);
      const assignDocuments = this.createBatchAssignDocumentsFunction(assignDocument);

      let result;
      if (dto.id) {
        result = await this.updateChecklist(dto, warehouseLocation, repos, assignDocuments);
      } else {
        result = await this.createNewChecklist(dto, warehouseLocation, repos, assignDocuments);
      }

      if (submit) {
        warehouseLocation.status = WarehouseLocationStatus.PENDING;
        await repos.warehouseLocation.save(warehouseLocation);
      }

      return result;
    });

    const hydratedChecklist = await this.warehouseLocationChecklistRepository.findOne({
      where: { id: savedChecklist.id },
      relations: [
        'ownershipLegalDocuments',
        'humanResourcesKey',
        'locationRisk',
        'securityPerimeter',
        'infrastructureUtilities',
        'storageFacilities',
        'registrationFee',
        'declaration',
      ],
    });

    return {
      message: 'Warehouse location checklist saved successfully',
      data: await this.mapChecklistEntityToResponse(hydratedChecklist!, warehouseLocation.applicationId),
    };
  }

  private async getRejectedChecklistSectionIdsForLocation(
    warehouseLocationId: string,
  ): Promise<string[]> {
  
    const assignments = await this.assignmentRepository.find({
      where: {
        applicationLocationId: warehouseLocationId,
        level: AssignmentLevel.HOD_TO_APPLICANT,
        status: AssignmentStatus.REJECTED,
      },
    });
  
    if (!assignments.length) return [];
  
    const assignmentSections = await this.assignmentSectionRepository.find({
      where: {
        assignmentId: In(assignments.map(a => a.id)),
      },
      select: {
        resourceId: true,
        sectionType: true,
      },
    });
  
    // ONLY checklist section
    const checklistSections = assignmentSections.filter(
      s => s.sectionType === '8-key-submission-checklist',
    );
  
    return checklistSections
      .map(s => s.resourceId as string)
      .filter(Boolean);
  }
  

  async updateWarehouseLocationChecklist(
    warehouseLocationId: string,
    dto: CreateWarehouseLocationChecklistDto,
    userId: string,
    submit: boolean = false,
  ) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location not found. Please create a warehouse location first.');
    }

    if (![WarehouseLocationStatus.DRAFT, WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
      throw new BadRequestException('Checklist can only be updated while warehouse location is in draft, rejected, or resubmitted status.');
    }

    const existingChecklist = await this.warehouseLocationChecklistRepository.findOne({
      where: { warehouseLocationId: warehouseLocation.id },
    });

    if (!existingChecklist) {
      throw new NotFoundException('Checklist not found for this warehouse location. Please create it first.');
    }

    dto.id = existingChecklist.id;

    // Process base64 files from DTO
    await this.processBase64FilesInDto(dto, userId, warehouseLocationId);
    this.validateChecklistFiles(dto);
  
    let rejectedSectionIds: string[] = [];
  
    const savedChecklist = await this.dataSource.transaction(async (manager) => {
      const repos = {
        checklist: manager.getRepository(WarehouseLocationChecklistEntity),
        ownershipLegal: manager.getRepository(OwnershipLegalDocumentsEntity),
        ownershipLegalHistory: manager.getRepository(OwnershipLegalDocumentsHistoryEntity),
        humanResourcesKey: manager.getRepository(HumanResourcesKeyEntity),
        humanResourcesKeyHistory: manager.getRepository(HumanResourcesKeyHistoryEntity),
        locationRisk: manager.getRepository(LocationRiskEntity),
        locationRiskHistory: manager.getRepository(LocationRiskHistoryEntity),    
        securityPerimeter: manager.getRepository(SecurityPerimeterEntity),
        securityPerimeterHistory: manager.getRepository(SecurityPerimeterHistoryEntity),
        infrastructureUtilities: manager.getRepository(InfrastructureUtilitiesEntity),
        infrastructureUtilitiesHistory: manager.getRepository(InfrastructureUtilitiesHistoryEntity),
        storageFacilities: manager.getRepository(StorageFacilitiesEntity),
        storageFacilitiesHistory: manager.getRepository(StorageFacilitiesHistoryEntity),
        registrationFee: manager.getRepository(RegistrationFeeChecklistEntity),
        registrationFeeHistory: manager.getRepository(RegistrationFeeChecklistHistoryEntity),
        declaration: manager.getRepository(DeclarationChecklistEntity),
        declarationHistory: manager.getRepository(DeclarationChecklistHistoryEntity),
        document: manager.getRepository(WarehouseDocument),
        warehouseLocation: manager.getRepository(WarehouseLocation),
      };
  
      if([WarehouseLocationStatus.REJECTED, WarehouseLocationStatus.RESUBMITTED].includes(warehouseLocation.status)) {
        rejectedSectionIds = await this.getRejectedChecklistSectionIdsForLocation(warehouseLocationId);
      }
  
      if(rejectedSectionIds.length > 0) {
        if (rejectedSectionIds.includes(existingChecklist.humanResourcesKeyId ?? '')) {
          await repos.humanResourcesKeyHistory.save({
            ...existingChecklist.humanResourcesKey,
            humanResourcesKeyId: existingChecklist.humanResourcesKeyId ?? '',
            warehouseLocationChecklist: existingChecklist,
          });
        }
    
        if (rejectedSectionIds.includes(existingChecklist.ownershipLegalDocumentsId ?? '')) {
          await repos.ownershipLegalHistory.save({
            ...existingChecklist.ownershipLegalDocuments,
            ownershipLegalDocumentsId: existingChecklist.ownershipLegalDocumentsId ?? '',
            warehouseLocationChecklist: existingChecklist,
          });
        }
    
        if (rejectedSectionIds.includes(existingChecklist.locationRiskId ?? '')) {
          await repos.locationRiskHistory.save({
            ...existingChecklist.locationRisk,
            locationRiskId: existingChecklist.locationRiskId ?? '',
            warehouseLocationChecklist: existingChecklist,
          });
        }
    
        if (rejectedSectionIds.includes(existingChecklist.securityPerimeterId ?? '')) {
          await repos.securityPerimeterHistory.save({
            ...existingChecklist.securityPerimeter,
            securityPerimeterId: existingChecklist.securityPerimeterId ?? '',
            warehouseLocationChecklist: existingChecklist,
          });
        }
    
        if (rejectedSectionIds.includes(existingChecklist.infrastructureUtilitiesId ?? '')) {
          await repos.infrastructureUtilitiesHistory.save({
            ...existingChecklist.infrastructureUtilities,
            infrastructureUtilitiesId:
              existingChecklist.infrastructureUtilitiesId ?? '',
            warehouseLocationChecklist: existingChecklist,
          });
        }
    
        if (rejectedSectionIds.includes(existingChecklist.storageFacilitiesId ?? '')) {
          await repos.storageFacilitiesHistory.save({
            ...existingChecklist.storageFacilities,
            storageFacilitiesId: existingChecklist.storageFacilitiesId ?? '',
            warehouseLocationChecklist: existingChecklist,
          });
        }

        if (rejectedSectionIds.includes(existingChecklist.registrationFeeId ?? '')) {
          await repos.registrationFeeHistory.save({
            ...existingChecklist.registrationFee,
            registrationFeeChecklistId: existingChecklist.registrationFeeId ?? '',
          });
        }
        
        if (rejectedSectionIds.includes(existingChecklist.declarationId ?? '')) {
          await repos.declarationHistory.save({
            ...existingChecklist.declaration,
            declarationChecklistId: existingChecklist.declarationId ?? '',
          });
        }
      }
  
      const assignDocument = this.createAssignDocumentFunction(repos.document, userId);
      const assignDocuments = this.createBatchAssignDocumentsFunction(assignDocument);
  
      const result = await this.updateChecklist(dto, warehouseLocation, repos, assignDocuments);
  
      if (submit) {
        warehouseLocation.status = WarehouseLocationStatus.PENDING;
        await repos.warehouseLocation.save(warehouseLocation);
      }
  
      return result;
    });
  
    // Track resubmission for each rejected section (after transaction)
    const updatedApplication = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId },
    });
  
    if (updatedApplication?.status === WarehouseLocationStatus.REJECTED && rejectedSectionIds.length > 0) {
      const assignments = await this.assignmentRepository.find({
        where: {
          applicationLocationId: warehouseLocationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });
  
      // Map section IDs to their section types
      const sectionIdToType: { id: string | null; type: string }[] = [
        { id: existingChecklist.humanResourcesKeyId ?? '', type: '8-key-submission-checklist' },
        { id: existingChecklist.ownershipLegalDocumentsId ?? '', type: '8-key-submission-checklist' },
        { id: existingChecklist.locationRiskId ?? '', type: '8-key-submission-checklist' },
        { id: existingChecklist.securityPerimeterId ?? '', type: '8-key-submission-checklist' },
        { id: existingChecklist.infrastructureUtilitiesId ?? '', type: '8-key-submission-checklist' },
        { id: existingChecklist.storageFacilitiesId ?? '', type: '8-key-submission-checklist' },
        { id: existingChecklist.registrationFeeId ?? '', type: '8-key-submission-checklist' },
        { id: existingChecklist.declarationId ?? '', type: '8-key-submission-checklist' },
      ];
  
      for (const section of sectionIdToType) {
        if (section.id && rejectedSectionIds.includes(section.id)) {
          let assignmentSectionId: string | null = null;
  
          if (assignments.length > 0) {
            const assignmentSections = await this.assignmentSectionRepository.find({
              where: {
                assignmentId: In(assignments.map((a) => a.id)),
                sectionType: section.type,
                resourceId: section.id,
              },
            });
  
            if (assignmentSections.length > 0) {
              assignmentSectionId = assignmentSections[0].id;
            }
          }
  
          await this.warehouseLocationService.trackWarehouseLocationResubmissionAndUpdateStatus(
            warehouseLocationId,
            section.type,
            section.id,
            assignmentSectionId ?? undefined,
          );
        }
      }
    }
  
    const hydratedChecklist = await this.warehouseLocationChecklistRepository.findOne({
      where: { id: savedChecklist.id },
      relations: [
        'ownershipLegalDocuments',
        'humanResourcesKey',
        'locationRisk',
        'securityPerimeter',
        'infrastructureUtilities',
        'storageFacilities',
        'registrationFee',
        'declaration',
      ],
    });
  
    return {
      message: 'Warehouse location checklist updated successfully',
      data: await this.mapChecklistEntityToResponse(hydratedChecklist!, warehouseLocation.applicationId),
    };
  }

  private async createNewChecklist(
    dto: CreateWarehouseLocationChecklistDto,
    warehouseLocation: WarehouseLocation,
    repos: any,
    assignDocuments: Function,
  ) {
    // Create all sub-entities
    const ownershipLegal = await repos.ownershipLegal.save(
      repos.ownershipLegal.create({
        ...dto.ownershipLegalDocuments,
        ownershipDeedFile: dto.ownershipLegalDocuments.ownershipDeedFile ?? null,
        mutationDeedFile: dto.ownershipLegalDocuments.mutationDeedFile ?? null,
        nocNecFile: dto.ownershipLegalDocuments.nocNecFile ?? null,
        factoryLayoutFile: dto.ownershipLegalDocuments.factoryLayoutFile ?? null,
        leaseAgreementFile: dto.ownershipLegalDocuments.leaseAgreementFile ?? null,
        propertyWarrantyFile: dto.ownershipLegalDocuments.propertyWarrantyFile ?? null,
        agreementUndertakingFile: dto.ownershipLegalDocuments.agreementUndertakingFile ?? null,
      }),
    );

    const humanResourcesKey = await repos.humanResourcesKey.save(
      repos.humanResourcesKey.create({
        ...dto.humanResourcesKey,
        qcPersonnelFile: dto.humanResourcesKey.qcPersonnelFile ?? null,
        warehouseSupervisorFile: dto.humanResourcesKey.warehouseSupervisorFile ?? null,
        dataEntryOperatorFile: dto.humanResourcesKey.dataEntryOperatorFile ?? null,
      }),
    );

    const locationRisk = await repos.locationRisk.save(
      repos.locationRisk.create({
        ...dto.locationRisk,
        warehouseOutsideFloodingAreaFile: dto.locationRisk.warehouseOutsideFloodingAreaFile ?? null,
      }),
    );

    const securityPerimeter = await repos.securityPerimeter.save(
      repos.securityPerimeter.create({
        ...dto.securityPerimeter,
        securedBoundaryWallFile: dto.securityPerimeter.securedBoundaryWallFile ?? null,
        reinforcedBarbedWireFile: dto.securityPerimeter.reinforcedBarbedWireFile ?? null,
        fullyGatedFile: dto.securityPerimeter.fullyGatedFile ?? null,
        securityGuards24x7File: dto.securityPerimeter.securityGuards24x7File ?? null,
        cctvCamerasFile: dto.securityPerimeter.cctvCamerasFile ?? null,
      }),
    );

    const infrastructureUtilities = await repos.infrastructureUtilities.save(
      repos.infrastructureUtilities.create({
        ...dto.infrastructureUtilities,
        functionalWeighbridgeFile: dto.infrastructureUtilities.functionalWeighbridgeFile ?? null,
        samplingTestingAreaFile: dto.infrastructureUtilities.samplingTestingAreaFile ?? null,
        calibratedInstrumentsFile: dto.infrastructureUtilities.calibratedInstrumentsFile ?? null,
        functionalOfficeFile: dto.infrastructureUtilities.functionalOfficeFile ?? null,
        operationalToiletsFile: dto.infrastructureUtilities.operationalToiletsFile ?? null,
        electricityGasUtilitiesFile: dto.infrastructureUtilities.electricityGasUtilitiesFile ?? null,
        backupGeneratorFile: dto.infrastructureUtilities.backupGeneratorFile ?? null,
        adequateResidentialArrangementsFile: dto.infrastructureUtilities.adequateResidentialArrangementsFile ?? null,
        axialAerationFansFile: dto.infrastructureUtilities.axialAerationFansFile ?? null,
        ventsExhaustFansFile: dto.infrastructureUtilities.ventsExhaustFansFile ?? null,
        technicalDrawingFile: dto.infrastructureUtilities.technicalDrawingFile ?? null,
        dryingFacilityFile: dto.infrastructureUtilities.dryingFacilityFile ?? null,
        temperatureSensorCablesFile: dto.infrastructureUtilities.temperatureSensorCablesFile ?? null,
      }),
    );

    const storageFacilities = await repos.storageFacilities.save(
      repos.storageFacilities.create({
        ...dto.storageFacilities,
        securedDoorsFile: dto.storageFacilities.securedDoorsFile ?? null,
        plasteredFlooringFile: dto.storageFacilities.plasteredFlooringFile ?? null,
        plasteredWallsFile: dto.storageFacilities.plasteredWallsFile ?? null,
        intactCeilingFile: dto.storageFacilities.intactCeilingFile ?? null,
        functionalWindowsFile: dto.storageFacilities.functionalWindowsFile ?? null,
        protectiveNettingFile: dto.storageFacilities.protectiveNettingFile ?? null,
        functionalExhaustFansFile: dto.storageFacilities.functionalExhaustFansFile ?? null,
        freeFromPestsFile: dto.storageFacilities.freeFromPestsFile ?? null,
        fireSafetyMeasuresFile: dto.storageFacilities.fireSafetyMeasuresFile ?? null,
      }),
    );

    const registrationFee = await repos.registrationFee.save(
      repos.registrationFee.create({
        bankPaymentSlip: dto.registrationFee.bankPaymentSlip ?? null,
      }),
    );

    const declaration = await repos.declaration.save(
      repos.declaration.create({
        ...dto.declaration,
      }),
    );

    const checklist = repos.checklist.create({
      warehouseLocationId: warehouseLocation.id,
      ownershipLegalDocumentsId: ownershipLegal.id,
      humanResourcesKeyId: humanResourcesKey.id,
      locationRiskId: locationRisk.id,
      securityPerimeterId: securityPerimeter.id,
      infrastructureUtilitiesId: infrastructureUtilities.id,
      storageFacilitiesId: storageFacilities.id,
      registrationFeeId: registrationFee.id,
      declarationId: declaration.id,
    });
    await repos.checklist.save(checklist);

    // Update child entities with checklist reference
    ownershipLegal.warehouseLocationChecklist = checklist;
    await repos.ownershipLegal.save(ownershipLegal);

    humanResourcesKey.warehouseLocationChecklist = checklist;
    await repos.humanResourcesKey.save(humanResourcesKey);

    locationRisk.warehouseLocationChecklist = checklist;
    await repos.locationRisk.save(locationRisk);

    securityPerimeter.warehouseLocationChecklist = checklist;
    await repos.securityPerimeter.save(securityPerimeter);

    infrastructureUtilities.warehouseLocationChecklist = checklist;
    await repos.infrastructureUtilities.save(infrastructureUtilities);

    storageFacilities.warehouseLocationChecklist = checklist;
    await repos.storageFacilities.save(storageFacilities);

    registrationFee.warehouseLocationChecklist = checklist as any;
    await repos.registrationFee.save(registrationFee);

    declaration.warehouseLocationChecklist = checklist as any;
    await repos.declaration.save(declaration);

    // Assign documents - create array of all documents to assign
    const documentsToAssign: Array<{ id: string | null; type: string; documentType: string; entityId: string }> = [];

    // Ownership & Legal Documents
    if (dto.ownershipLegalDocuments.ownershipDeedFile) {
      documentsToAssign.push({ id: dto.ownershipLegalDocuments.ownershipDeedFile, type: 'OwnershipLegalDocumentsChecklist', documentType: 'ownershipDeedFile', entityId: ownershipLegal.id });
    }
    if (dto.ownershipLegalDocuments.mutationDeedFile) {
      documentsToAssign.push({ id: dto.ownershipLegalDocuments.mutationDeedFile, type: 'OwnershipLegalDocumentsChecklist', documentType: 'mutationDeedFile', entityId: ownershipLegal.id });
    }
    if (dto.ownershipLegalDocuments.nocNecFile) {
      documentsToAssign.push({ id: dto.ownershipLegalDocuments.nocNecFile, type: 'OwnershipLegalDocumentsChecklist', documentType: 'nocNecFile', entityId: ownershipLegal.id });
    }
    if (dto.ownershipLegalDocuments.factoryLayoutFile) {
      documentsToAssign.push({ id: dto.ownershipLegalDocuments.factoryLayoutFile, type: 'OwnershipLegalDocumentsChecklist', documentType: 'factoryLayoutFile', entityId: ownershipLegal.id });
    }
    if (dto.ownershipLegalDocuments.leaseAgreementFile) {
      documentsToAssign.push({ id: dto.ownershipLegalDocuments.leaseAgreementFile, type: 'OwnershipLegalDocumentsChecklist', documentType: 'leaseAgreementFile', entityId: ownershipLegal.id });
    }
    if (dto.ownershipLegalDocuments.propertyWarrantyFile) {
      documentsToAssign.push({ id: dto.ownershipLegalDocuments.propertyWarrantyFile, type: 'OwnershipLegalDocumentsChecklist', documentType: 'propertyWarrantyFile', entityId: ownershipLegal.id });
    }
    if (dto.ownershipLegalDocuments.agreementUndertakingFile) {
      documentsToAssign.push({ id: dto.ownershipLegalDocuments.agreementUndertakingFile, type: 'OwnershipLegalDocumentsChecklist', documentType: 'agreementUndertakingFile', entityId: ownershipLegal.id });
    }

    // Human Resources Key
    if (dto.humanResourcesKey.qcPersonnelFile) {
      documentsToAssign.push({ id: dto.humanResourcesKey.qcPersonnelFile, type: 'HumanResourcesKeyChecklist', documentType: 'qcPersonnelFile', entityId: humanResourcesKey.id });
    }
    if (dto.humanResourcesKey.warehouseSupervisorFile) {
      documentsToAssign.push({ id: dto.humanResourcesKey.warehouseSupervisorFile, type: 'HumanResourcesKeyChecklist', documentType: 'warehouseSupervisorFile', entityId: humanResourcesKey.id });
    }
    if (dto.humanResourcesKey.dataEntryOperatorFile) {
      documentsToAssign.push({ id: dto.humanResourcesKey.dataEntryOperatorFile, type: 'HumanResourcesKeyChecklist', documentType: 'dataEntryOperatorFile', entityId: humanResourcesKey.id });
    }

    // Location & Risk
    if (dto.locationRisk.warehouseOutsideFloodingAreaFile) {
      documentsToAssign.push({ id: dto.locationRisk.warehouseOutsideFloodingAreaFile, type: 'LocationRiskChecklist', documentType: 'warehouseOutsideFloodingAreaFile', entityId: locationRisk.id });
    }

    // Security & Perimeter
    if (dto.securityPerimeter.securedBoundaryWallFile) {
      documentsToAssign.push({ id: dto.securityPerimeter.securedBoundaryWallFile, type: 'SecurityPerimeterChecklist', documentType: 'securedBoundaryWallFile', entityId: securityPerimeter.id });
    }
    if (dto.securityPerimeter.reinforcedBarbedWireFile) {
      documentsToAssign.push({ id: dto.securityPerimeter.reinforcedBarbedWireFile, type: 'SecurityPerimeterChecklist', documentType: 'reinforcedBarbedWireFile', entityId: securityPerimeter.id });
    }
    if (dto.securityPerimeter.fullyGatedFile) {
      documentsToAssign.push({ id: dto.securityPerimeter.fullyGatedFile, type: 'SecurityPerimeterChecklist', documentType: 'fullyGatedFile', entityId: securityPerimeter.id });
    }
    if (dto.securityPerimeter.securityGuards24x7File) {
      documentsToAssign.push({ id: dto.securityPerimeter.securityGuards24x7File, type: 'SecurityPerimeterChecklist', documentType: 'securityGuards24x7File', entityId: securityPerimeter.id });
    }
    if (dto.securityPerimeter.cctvCamerasFile) {
      documentsToAssign.push({ id: dto.securityPerimeter.cctvCamerasFile, type: 'SecurityPerimeterChecklist', documentType: 'cctvCamerasFile', entityId: securityPerimeter.id });
    }

    // Infrastructure & Utilities
    if (dto.infrastructureUtilities.functionalWeighbridgeFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.functionalWeighbridgeFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'functionalWeighbridgeFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.samplingTestingAreaFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.samplingTestingAreaFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'samplingTestingAreaFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.calibratedInstrumentsFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.calibratedInstrumentsFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'calibratedInstrumentsFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.functionalOfficeFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.functionalOfficeFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'functionalOfficeFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.operationalToiletsFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.operationalToiletsFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'operationalToiletsFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.electricityGasUtilitiesFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.electricityGasUtilitiesFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'electricityGasUtilitiesFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.backupGeneratorFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.backupGeneratorFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'backupGeneratorFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.adequateResidentialArrangementsFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.adequateResidentialArrangementsFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'adequateResidentialArrangementsFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.axialAerationFansFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.axialAerationFansFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'axialAerationFansFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.ventsExhaustFansFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.ventsExhaustFansFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'ventsExhaustFansFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.technicalDrawingFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.technicalDrawingFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'technicalDrawingFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.dryingFacilityFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.dryingFacilityFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'dryingFacilityFile', entityId: infrastructureUtilities.id });
    }
    if (dto.infrastructureUtilities.temperatureSensorCablesFile) {
      documentsToAssign.push({ id: dto.infrastructureUtilities.temperatureSensorCablesFile, type: 'InfrastructureUtilitiesChecklist', documentType: 'temperatureSensorCablesFile', entityId: infrastructureUtilities.id });
    }

    // Storage Facilities
    if (dto.storageFacilities.securedDoorsFile) {
      documentsToAssign.push({ id: dto.storageFacilities.securedDoorsFile, type: 'StorageFacilitiesChecklist', documentType: 'securedDoorsFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.plasteredFlooringFile) {
      documentsToAssign.push({ id: dto.storageFacilities.plasteredFlooringFile, type: 'StorageFacilitiesChecklist', documentType: 'plasteredFlooringFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.plasteredWallsFile) {
      documentsToAssign.push({ id: dto.storageFacilities.plasteredWallsFile, type: 'StorageFacilitiesChecklist', documentType: 'plasteredWallsFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.intactCeilingFile) {
      documentsToAssign.push({ id: dto.storageFacilities.intactCeilingFile, type: 'StorageFacilitiesChecklist', documentType: 'intactCeilingFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.functionalWindowsFile) {
      documentsToAssign.push({ id: dto.storageFacilities.functionalWindowsFile, type: 'StorageFacilitiesChecklist', documentType: 'functionalWindowsFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.protectiveNettingFile) {
      documentsToAssign.push({ id: dto.storageFacilities.protectiveNettingFile, type: 'StorageFacilitiesChecklist', documentType: 'protectiveNettingFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.functionalExhaustFansFile) {
      documentsToAssign.push({ id: dto.storageFacilities.functionalExhaustFansFile, type: 'StorageFacilitiesChecklist', documentType: 'functionalExhaustFansFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.freeFromPestsFile) {
      documentsToAssign.push({ id: dto.storageFacilities.freeFromPestsFile, type: 'StorageFacilitiesChecklist', documentType: 'freeFromPestsFile', entityId: storageFacilities.id });
    }
    if (dto.storageFacilities.fireSafetyMeasuresFile) {
      documentsToAssign.push({ id: dto.storageFacilities.fireSafetyMeasuresFile, type: 'StorageFacilitiesChecklist', documentType: 'fireSafetyMeasuresFile', entityId: storageFacilities.id });
    }

    // Registration Fee
    if (dto.registrationFee.bankPaymentSlip) {
      documentsToAssign.push({ id: dto.registrationFee.bankPaymentSlip, type: 'RegistrationFeeChecklist', documentType: 'bankPaymentSlip', entityId: registrationFee.id });
    }

    if (documentsToAssign.length > 0) {
      await assignDocuments(documentsToAssign);
    }

    return checklist;
  }

  private async updateChecklist(
    dto: CreateWarehouseLocationChecklistDto,
    warehouseLocation: WarehouseLocation,
    repos: any,
    assignDocuments: Function,
  ) {
    const existingChecklist = await repos.checklist.findOne({
      where: { id: dto.id, warehouseLocationId: warehouseLocation.id },
      relations: [
        'ownershipLegalDocuments',
        'humanResourcesKey',
        'locationRisk',
        'securityPerimeter',
        'infrastructureUtilities',
        'storageFacilities',
        'registrationFee',
        'declaration',
      ],
    });

    if (!existingChecklist) {
      throw new NotFoundException('Checklist not found for this warehouse location.');
    }

    // Update or create each section
    let ownershipLegal = existingChecklist.ownershipLegalDocuments;
    if (ownershipLegal) {
      Object.assign(ownershipLegal, dto.ownershipLegalDocuments);
      ownershipLegal = await repos.ownershipLegal.save(ownershipLegal);
    } else {
      ownershipLegal = await repos.ownershipLegal.save(
        repos.ownershipLegal.create({ ...dto.ownershipLegalDocuments, warehouseLocationChecklist: existingChecklist }),
      );
      existingChecklist.ownershipLegalDocuments = ownershipLegal;
      existingChecklist.ownershipLegalDocumentsId = ownershipLegal.id;
    }

    let humanResourcesKey = existingChecklist.humanResourcesKey;
    if (humanResourcesKey) {
      Object.assign(humanResourcesKey, dto.humanResourcesKey);
      humanResourcesKey = await repos.humanResourcesKey.save(humanResourcesKey);
    } else {
      humanResourcesKey = await repos.humanResourcesKey.save(
        repos.humanResourcesKey.create({ ...dto.humanResourcesKey, warehouseLocationChecklist: existingChecklist }),
      );
      existingChecklist.humanResourcesKey = humanResourcesKey;
      existingChecklist.humanResourcesKeyId = humanResourcesKey.id;
    }

    let locationRisk = existingChecklist.locationRisk;
    if (locationRisk) {
      Object.assign(locationRisk, dto.locationRisk);
      locationRisk = await repos.locationRisk.save(locationRisk);
    } else {
      locationRisk = await repos.locationRisk.save(
        repos.locationRisk.create({ ...dto.locationRisk, warehouseLocationChecklist: existingChecklist }),
      );
      existingChecklist.locationRisk = locationRisk;
      existingChecklist.locationRiskId = locationRisk.id;
    }

    let securityPerimeter = existingChecklist.securityPerimeter;
    if (securityPerimeter) {
      Object.assign(securityPerimeter, dto.securityPerimeter);
      securityPerimeter = await repos.securityPerimeter.save(securityPerimeter);
    } else {
      securityPerimeter = await repos.securityPerimeter.save(
        repos.securityPerimeter.create({ ...dto.securityPerimeter, warehouseLocationChecklist: existingChecklist }),
      );
      existingChecklist.securityPerimeter = securityPerimeter;
      existingChecklist.securityPerimeterId = securityPerimeter.id;
    }

    let infrastructureUtilities = existingChecklist.infrastructureUtilities;
    if (infrastructureUtilities) {
      Object.assign(infrastructureUtilities, dto.infrastructureUtilities);
      infrastructureUtilities = await repos.infrastructureUtilities.save(infrastructureUtilities);
    } else {
      infrastructureUtilities = await repos.infrastructureUtilities.save(
        repos.infrastructureUtilities.create({ ...dto.infrastructureUtilities, warehouseLocationChecklist: existingChecklist }),
      );
      existingChecklist.infrastructureUtilities = infrastructureUtilities;
      existingChecklist.infrastructureUtilitiesId = infrastructureUtilities.id;
    }

    let storageFacilities = existingChecklist.storageFacilities;
    if (storageFacilities) {
      Object.assign(storageFacilities, dto.storageFacilities);
      storageFacilities = await repos.storageFacilities.save(storageFacilities);
    } else {
      storageFacilities = await repos.storageFacilities.save(
        repos.storageFacilities.create({ ...dto.storageFacilities, warehouseLocationChecklist: existingChecklist }),
      );
      existingChecklist.storageFacilities = storageFacilities;
      existingChecklist.storageFacilitiesId = storageFacilities.id;
    }

    let registrationFee = existingChecklist.registrationFee;
    if (registrationFee) {
      Object.assign(registrationFee, { bankPaymentSlip: dto.registrationFee.bankPaymentSlip ?? registrationFee.bankPaymentSlip });
      registrationFee = await repos.registrationFee.save(registrationFee);
    } else {
      registrationFee = await repos.registrationFee.save(
        repos.registrationFee.create({ ...dto.registrationFee, warehouseLocationChecklist: existingChecklist as any }),
      );
      existingChecklist.registrationFee = registrationFee;
      existingChecklist.registrationFeeId = registrationFee.id;
    }

    let declaration = existingChecklist.declaration;
    if (declaration) {
      Object.assign(declaration, dto.declaration);
      declaration = await repos.declaration.save(declaration);
    } else {
      declaration = await repos.declaration.save(
        repos.declaration.create({ ...dto.declaration, warehouseLocationChecklist: existingChecklist as any }),
      );
      existingChecklist.declaration = declaration;
      existingChecklist.declarationId = declaration.id;
    }

    await repos.checklist.save(existingChecklist);

    // Assign documents for all sections (similar to createNewChecklist)
    const documentsToAssign: Array<{ id: string | null; type: string; documentType: string; entityId: string; oldId?: string | null }> = [];

    // Ownership & Legal Documents
    const oldOwnershipLegal = existingChecklist.ownershipLegalDocuments;
    if (dto.ownershipLegalDocuments.ownershipDeed && dto.ownershipLegalDocuments.ownershipDeedFile) {
      documentsToAssign.push({
        id: dto.ownershipLegalDocuments.ownershipDeedFile,
        type: 'OwnershipLegalDocumentsChecklist',
        documentType: 'ownershipDeedFile',
        entityId: ownershipLegal.id,
        oldId: oldOwnershipLegal?.ownershipDeedFile,
      });
    }
    if (dto.ownershipLegalDocuments.mutationDeed && dto.ownershipLegalDocuments.mutationDeedFile) {
      documentsToAssign.push({
        id: dto.ownershipLegalDocuments.mutationDeedFile,
        type: 'OwnershipLegalDocumentsChecklist',
        documentType: 'mutationDeedFile',
        entityId: ownershipLegal.id,
        oldId: oldOwnershipLegal?.mutationDeedFile,
      });
    }
    if (dto.ownershipLegalDocuments.nocNec && dto.ownershipLegalDocuments.nocNecFile) {
      documentsToAssign.push({
        id: dto.ownershipLegalDocuments.nocNecFile,
        type: 'OwnershipLegalDocumentsChecklist',
        documentType: 'nocNecFile',
        entityId: ownershipLegal.id,
        oldId: oldOwnershipLegal?.nocNecFile,
      });
    }
    if (dto.ownershipLegalDocuments.factoryLayout && dto.ownershipLegalDocuments.factoryLayoutFile) {
      documentsToAssign.push({
        id: dto.ownershipLegalDocuments.factoryLayoutFile,
        type: 'OwnershipLegalDocumentsChecklist',
        documentType: 'factoryLayoutFile',
        entityId: ownershipLegal.id,
        oldId: oldOwnershipLegal?.factoryLayoutFile,
      });
    }
    if (dto.ownershipLegalDocuments.leaseAgreement && dto.ownershipLegalDocuments.leaseAgreementFile) {
      documentsToAssign.push({
        id: dto.ownershipLegalDocuments.leaseAgreementFile,
        type: 'OwnershipLegalDocumentsChecklist',
        documentType: 'leaseAgreementFile',
        entityId: ownershipLegal.id,
        oldId: oldOwnershipLegal?.leaseAgreementFile,
      });
    }
    if (dto.ownershipLegalDocuments.propertyWarranty && dto.ownershipLegalDocuments.propertyWarrantyFile) {
      documentsToAssign.push({
        id: dto.ownershipLegalDocuments.propertyWarrantyFile,
        type: 'OwnershipLegalDocumentsChecklist',
        documentType: 'propertyWarrantyFile',
        entityId: ownershipLegal.id,
        oldId: oldOwnershipLegal?.propertyWarrantyFile,
      });
    }
    if (dto.ownershipLegalDocuments.agreementUndertaking && dto.ownershipLegalDocuments.agreementUndertakingFile) {
      documentsToAssign.push({
        id: dto.ownershipLegalDocuments.agreementUndertakingFile,
        type: 'OwnershipLegalDocumentsChecklist',
        documentType: 'agreementUndertakingFile',
        entityId: ownershipLegal.id,
        oldId: oldOwnershipLegal?.agreementUndertakingFile,
      });
    }

    // Human Resources Key
    const oldHumanResourcesKey = existingChecklist.humanResourcesKey;
    if (dto.humanResourcesKey.qcPersonnel && dto.humanResourcesKey.qcPersonnelFile) {
      documentsToAssign.push({
        id: dto.humanResourcesKey.qcPersonnelFile,
        type: 'HumanResourcesKeyChecklist',
        documentType: 'qcPersonnelFile',
        entityId: humanResourcesKey.id,
        oldId: oldHumanResourcesKey?.qcPersonnelFile,
      });
    }
    if (dto.humanResourcesKey.warehouseSupervisor && dto.humanResourcesKey.warehouseSupervisorFile) {
      documentsToAssign.push({
        id: dto.humanResourcesKey.warehouseSupervisorFile,
        type: 'HumanResourcesKeyChecklist',
        documentType: 'warehouseSupervisorFile',
        entityId: humanResourcesKey.id,
        oldId: oldHumanResourcesKey?.warehouseSupervisorFile,
      });
    }
    if (dto.humanResourcesKey.dataEntryOperator && dto.humanResourcesKey.dataEntryOperatorFile) {
      documentsToAssign.push({
        id: dto.humanResourcesKey.dataEntryOperatorFile,
        type: 'HumanResourcesKeyChecklist',
        documentType: 'dataEntryOperatorFile',
        entityId: humanResourcesKey.id,
        oldId: oldHumanResourcesKey?.dataEntryOperatorFile,
      });
    }

    // Location & Risk
    const oldLocationRisk = existingChecklist.locationRisk;
    if (dto.locationRisk.warehouseOutsideFloodingArea && dto.locationRisk.warehouseOutsideFloodingAreaFile) {
      documentsToAssign.push({
        id: dto.locationRisk.warehouseOutsideFloodingAreaFile,
        type: 'LocationRiskChecklist',
        documentType: 'warehouseOutsideFloodingAreaFile',
        entityId: locationRisk.id,
        oldId: oldLocationRisk?.warehouseOutsideFloodingAreaFile,
      });
    }

    // Security & Perimeter
    const oldSecurityPerimeter = existingChecklist.securityPerimeter;
    if (dto.securityPerimeter.securedBoundaryWall && dto.securityPerimeter.securedBoundaryWallFile) {
      documentsToAssign.push({
        id: dto.securityPerimeter.securedBoundaryWallFile,
        type: 'SecurityPerimeterChecklist',
        documentType: 'securedBoundaryWallFile',
        entityId: securityPerimeter.id,
        oldId: oldSecurityPerimeter?.securedBoundaryWallFile,
      });
    }
    if (dto.securityPerimeter.reinforcedBarbedWire && dto.securityPerimeter.reinforcedBarbedWireFile) {
      documentsToAssign.push({
        id: dto.securityPerimeter.reinforcedBarbedWireFile,
        type: 'SecurityPerimeterChecklist',
        documentType: 'reinforcedBarbedWireFile',
        entityId: securityPerimeter.id,
        oldId: oldSecurityPerimeter?.reinforcedBarbedWireFile,
      });
    }
    if (dto.securityPerimeter.fullyGated && dto.securityPerimeter.fullyGatedFile) {
      documentsToAssign.push({
        id: dto.securityPerimeter.fullyGatedFile,
        type: 'SecurityPerimeterChecklist',
        documentType: 'fullyGatedFile',
        entityId: securityPerimeter.id,
        oldId: oldSecurityPerimeter?.fullyGatedFile,
      });
    }
    if (dto.securityPerimeter.securityGuards24x7 && dto.securityPerimeter.securityGuards24x7File) {
      documentsToAssign.push({
        id: dto.securityPerimeter.securityGuards24x7File,
        type: 'SecurityPerimeterChecklist',
        documentType: 'securityGuards24x7File',
        entityId: securityPerimeter.id,
        oldId: oldSecurityPerimeter?.securityGuards24x7File,
      });
    }
    if (dto.securityPerimeter.cctvCameras && dto.securityPerimeter.cctvCamerasFile) {
      documentsToAssign.push({
        id: dto.securityPerimeter.cctvCamerasFile,
        type: 'SecurityPerimeterChecklist',
        documentType: 'cctvCamerasFile',
        entityId: securityPerimeter.id,
        oldId: oldSecurityPerimeter?.cctvCamerasFile,
      });
    }

    // Infrastructure & Utilities
    const oldInfrastructureUtilities = existingChecklist.infrastructureUtilities;
    if (dto.infrastructureUtilities.functionalWeighbridge && dto.infrastructureUtilities.functionalWeighbridgeFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.functionalWeighbridgeFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'functionalWeighbridgeFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.functionalWeighbridgeFile,
      });
    }
    if (dto.infrastructureUtilities.samplingTestingArea && dto.infrastructureUtilities.samplingTestingAreaFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.samplingTestingAreaFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'samplingTestingAreaFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.samplingTestingAreaFile,
      });
    }
    if (dto.infrastructureUtilities.calibratedInstruments && dto.infrastructureUtilities.calibratedInstrumentsFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.calibratedInstrumentsFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'calibratedInstrumentsFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.calibratedInstrumentsFile,
      });
    }
    if (dto.infrastructureUtilities.functionalOffice && dto.infrastructureUtilities.functionalOfficeFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.functionalOfficeFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'functionalOfficeFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.functionalOfficeFile,
      });
    }
    if (dto.infrastructureUtilities.operationalToilets && dto.infrastructureUtilities.operationalToiletsFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.operationalToiletsFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'operationalToiletsFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.operationalToiletsFile,
      });
    }
    if (dto.infrastructureUtilities.electricityGasUtilities && dto.infrastructureUtilities.electricityGasUtilitiesFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.electricityGasUtilitiesFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'electricityGasUtilitiesFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.electricityGasUtilitiesFile,
      });
    }
    if (dto.infrastructureUtilities.backupGenerator && dto.infrastructureUtilities.backupGeneratorFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.backupGeneratorFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'backupGeneratorFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.backupGeneratorFile,
      });
    }
    if (dto.infrastructureUtilities.adequateResidentialArrangements && dto.infrastructureUtilities.adequateResidentialArrangementsFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.adequateResidentialArrangementsFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'adequateResidentialArrangementsFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.adequateResidentialArrangementsFile,
      });
    }
    if (dto.infrastructureUtilities.axialAerationFans && dto.infrastructureUtilities.axialAerationFansFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.axialAerationFansFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'axialAerationFansFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.axialAerationFansFile,
      });
    }
    if (dto.infrastructureUtilities.ventsExhaustFans && dto.infrastructureUtilities.ventsExhaustFansFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.ventsExhaustFansFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'ventsExhaustFansFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.ventsExhaustFansFile,
      });
    }
    if (dto.infrastructureUtilities.technicalDrawing && dto.infrastructureUtilities.technicalDrawingFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.technicalDrawingFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'technicalDrawingFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.technicalDrawingFile,
      });
    }
    if (dto.infrastructureUtilities.dryingFacility && dto.infrastructureUtilities.dryingFacilityFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.dryingFacilityFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'dryingFacilityFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.dryingFacilityFile,
      });
    }
    if (dto.infrastructureUtilities.temperatureSensorCables && dto.infrastructureUtilities.temperatureSensorCablesFile) {
      documentsToAssign.push({
        id: dto.infrastructureUtilities.temperatureSensorCablesFile,
        type: 'InfrastructureUtilitiesChecklist',
        documentType: 'temperatureSensorCablesFile',
        entityId: infrastructureUtilities.id,
        oldId: oldInfrastructureUtilities?.temperatureSensorCablesFile,
      });
    }

    // Storage Facilities
    const oldStorageFacilities = existingChecklist.storageFacilities;
    if (dto.storageFacilities.securedDoors && dto.storageFacilities.securedDoorsFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.securedDoorsFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'securedDoorsFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.securedDoorsFile,
      });
    }
    if (dto.storageFacilities.plasteredFlooring && dto.storageFacilities.plasteredFlooringFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.plasteredFlooringFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'plasteredFlooringFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.plasteredFlooringFile,
      });
    }
    if (dto.storageFacilities.plasteredWalls && dto.storageFacilities.plasteredWallsFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.plasteredWallsFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'plasteredWallsFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.plasteredWallsFile,
      });
    }
    if (dto.storageFacilities.intactCeiling && dto.storageFacilities.intactCeilingFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.intactCeilingFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'intactCeilingFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.intactCeilingFile,
      });
    }
    if (dto.storageFacilities.functionalWindows && dto.storageFacilities.functionalWindowsFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.functionalWindowsFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'functionalWindowsFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.functionalWindowsFile,
      });
    }
    if (dto.storageFacilities.protectiveNetting && dto.storageFacilities.protectiveNettingFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.protectiveNettingFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'protectiveNettingFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.protectiveNettingFile,
      });
    }
    if (dto.storageFacilities.functionalExhaustFans && dto.storageFacilities.functionalExhaustFansFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.functionalExhaustFansFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'functionalExhaustFansFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.functionalExhaustFansFile,
      });
    }
    if (dto.storageFacilities.freeFromPests && dto.storageFacilities.freeFromPestsFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.freeFromPestsFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'freeFromPestsFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.freeFromPestsFile,
      });
    }
    if (dto.storageFacilities.fireSafetyMeasures && dto.storageFacilities.fireSafetyMeasuresFile) {
      documentsToAssign.push({
        id: dto.storageFacilities.fireSafetyMeasuresFile,
        type: 'StorageFacilitiesChecklist',
        documentType: 'fireSafetyMeasuresFile',
        entityId: storageFacilities.id,
        oldId: oldStorageFacilities?.fireSafetyMeasuresFile,
      });
    }

    // Registration Fee
    const oldRegistrationFee = existingChecklist.registrationFee;
    if (dto.registrationFee.bankPaymentSlip) {
      documentsToAssign.push({
        id: dto.registrationFee.bankPaymentSlip,
        type: 'RegistrationFeeChecklist',
        documentType: 'bankPaymentSlip',
        entityId: registrationFee.id,
        oldId: oldRegistrationFee?.bankPaymentSlip,
      });
    }

    if (documentsToAssign.length > 0) {
      await assignDocuments(documentsToAssign);
    }

    return existingChecklist;
  }

  async getWarehouseLocationChecklist(warehouseLocationId: string, userId: string) {
    const warehouseLocation = await this.warehouseLocationRepository.findOne({
      where: { id: warehouseLocationId, userId },
    });

    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse location not found');
    }

    const checklist = await this.warehouseLocationChecklistRepository.findOne({
      where: { warehouseLocationId: warehouseLocation.id },
      relations: [
        'ownershipLegalDocuments',
        'ownershipLegalDocuments.ownershipDeedDocument',
        'ownershipLegalDocuments.mutationDeedDocument',
        'ownershipLegalDocuments.nocNecDocument',
        'ownershipLegalDocuments.factoryLayoutDocument',
        'ownershipLegalDocuments.leaseAgreementDocument',
        'ownershipLegalDocuments.propertyWarrantyDocument',
        'ownershipLegalDocuments.agreementUndertakingDocument',
        'humanResourcesKey',
        'humanResourcesKey.qcPersonnelDocument',
        'humanResourcesKey.warehouseSupervisorDocument',
        'humanResourcesKey.dataEntryOperatorDocument',
        'locationRisk',
        'locationRisk.warehouseOutsideFloodingAreaDocument',
        'securityPerimeter',
        'securityPerimeter.securedBoundaryWallDocument',
        'securityPerimeter.reinforcedBarbedWireDocument',
        'securityPerimeter.fullyGatedDocument',
        'securityPerimeter.securityGuards24x7Document',
        'securityPerimeter.cctvCamerasDocument',
        'infrastructureUtilities',
        'infrastructureUtilities.functionalWeighbridgeDocument',
        'infrastructureUtilities.samplingTestingAreaDocument',
        'infrastructureUtilities.calibratedInstrumentsDocument',
        'infrastructureUtilities.functionalOfficeDocument',
        'infrastructureUtilities.operationalToiletsDocument',
        'infrastructureUtilities.electricityGasUtilitiesDocument',
        'infrastructureUtilities.backupGeneratorDocument',
        'infrastructureUtilities.adequateResidentialArrangementsDocument',
        'infrastructureUtilities.axialAerationFansDocument',
        'infrastructureUtilities.ventsExhaustFansDocument',
        'infrastructureUtilities.technicalDrawingDocument',
        'infrastructureUtilities.dryingFacilityDocument',
        'infrastructureUtilities.temperatureSensorCablesDocument',
        'storageFacilities',
        'storageFacilities.securedDoorsDocument',
        'storageFacilities.plasteredFlooringDocument',
        'storageFacilities.plasteredWallsDocument',
        'storageFacilities.intactCeilingDocument',
        'storageFacilities.functionalWindowsDocument',
        'storageFacilities.protectiveNettingDocument',
        'storageFacilities.functionalExhaustFansDocument',
        'storageFacilities.freeFromPestsDocument',
        'storageFacilities.fireSafetyMeasuresDocument',
        'registrationFee',
        'registrationFee.bankPaymentSlipDocument',
        'declaration',
      ],
    });

    if (!checklist) {
      return {
        message: 'Warehouse location checklist not found',
        data: null,
      };
    }

    return {
      message: 'Warehouse location checklist retrieved successfully',
      data: await this.mapChecklistEntityToResponse(checklist, warehouseLocation.applicationId),
    };
  }

  private async mapChecklistEntityToResponse(checklist: WarehouseLocationChecklistEntity, applicationId?: string) {
    // If applicationId is not provided, fetch it from warehouseLocation
    let finalApplicationId = applicationId;
    if (!finalApplicationId) {
      const warehouseLocation = await this.warehouseLocationRepository.findOne({
        where: { id: checklist.warehouseLocationId },
        select: ['applicationId'],
      });
      finalApplicationId = warehouseLocation?.applicationId;
    }
    return {
      id: checklist.id,
      applicationId: finalApplicationId,
      ownershipLegalDocuments: checklist.ownershipLegalDocuments
        ? {
            id: checklist.ownershipLegalDocuments.id,
            ownershipDeed: checklist.ownershipLegalDocuments.ownershipDeed,
            ownershipDeedFile: checklist.ownershipLegalDocuments.ownershipDeedDocument
              ? {
                  documentId: checklist.ownershipLegalDocuments.ownershipDeedFile,
                  originalFileName: checklist.ownershipLegalDocuments.ownershipDeedDocument.originalFileName ?? undefined,
                }
              : null,
            mutationDeed: checklist.ownershipLegalDocuments.mutationDeed,
            mutationDeedFile: checklist.ownershipLegalDocuments.mutationDeedDocument
              ? {
                  documentId: checklist.ownershipLegalDocuments.mutationDeedFile,
                  originalFileName: checklist.ownershipLegalDocuments.mutationDeedDocument.originalFileName ?? undefined,
                }
              : null,
            nocNec: checklist.ownershipLegalDocuments.nocNec,
            nocNecFile: checklist.ownershipLegalDocuments.nocNecDocument
              ? {
                  documentId: checklist.ownershipLegalDocuments.nocNecFile,
                  originalFileName: checklist.ownershipLegalDocuments.nocNecDocument.originalFileName ?? undefined,
                }
              : null,
            factoryLayout: checklist.ownershipLegalDocuments.factoryLayout,
            factoryLayoutFile: checklist.ownershipLegalDocuments.factoryLayoutDocument
              ? {
                  documentId: checklist.ownershipLegalDocuments.factoryLayoutFile,
                  originalFileName: checklist.ownershipLegalDocuments.factoryLayoutDocument.originalFileName ?? undefined,
                }
              : null,
            leaseAgreement: checklist.ownershipLegalDocuments.leaseAgreement,
            leaseAgreementFile: checklist.ownershipLegalDocuments.leaseAgreementDocument
              ? {
                  documentId: checklist.ownershipLegalDocuments.leaseAgreementFile,
                  originalFileName: checklist.ownershipLegalDocuments.leaseAgreementDocument.originalFileName ?? undefined,
                }
              : null,
            propertyWarranty: checklist.ownershipLegalDocuments.propertyWarranty,
            propertyWarrantyFile: checklist.ownershipLegalDocuments.propertyWarrantyDocument
              ? {
                  documentId: checklist.ownershipLegalDocuments.propertyWarrantyFile,
                  originalFileName: checklist.ownershipLegalDocuments.propertyWarrantyDocument.originalFileName ?? undefined,
                }
              : null,
            agreementUndertaking: checklist.ownershipLegalDocuments.agreementUndertaking,
            agreementUndertakingFile: checklist.ownershipLegalDocuments.agreementUndertakingDocument
              ? {
                  documentId: checklist.ownershipLegalDocuments.agreementUndertakingFile,
                  originalFileName: checklist.ownershipLegalDocuments.agreementUndertakingDocument.originalFileName ?? undefined,
                }
              : null,
          }
        : null,
      humanResourcesKey: checklist.humanResourcesKey
        ? {
            id: checklist.humanResourcesKey.id,
            qcPersonnel: checklist.humanResourcesKey.qcPersonnel,
            qcPersonnelFile: checklist.humanResourcesKey.qcPersonnelDocument
              ? {
                  documentId: checklist.humanResourcesKey.qcPersonnelFile,
                  originalFileName: checklist.humanResourcesKey.qcPersonnelDocument.originalFileName ?? undefined,
                }
              : null,
            warehouseSupervisor: checklist.humanResourcesKey.warehouseSupervisor,
            warehouseSupervisorFile: checklist.humanResourcesKey.warehouseSupervisorDocument
              ? {
                  documentId: checklist.humanResourcesKey.warehouseSupervisorFile,
                  originalFileName: checklist.humanResourcesKey.warehouseSupervisorDocument.originalFileName ?? undefined,
                }
              : null,
            dataEntryOperator: checklist.humanResourcesKey.dataEntryOperator,
            dataEntryOperatorFile: checklist.humanResourcesKey.dataEntryOperatorDocument
              ? {
                  documentId: checklist.humanResourcesKey.dataEntryOperatorFile,
                  originalFileName: checklist.humanResourcesKey.dataEntryOperatorDocument.originalFileName ?? undefined,
                }
              : null,
          }
        : null,
      locationRisk: checklist.locationRisk
        ? {
            id: checklist.locationRisk.id,
            warehouseOutsideFloodingArea: checklist.locationRisk.warehouseOutsideFloodingArea,
            warehouseOutsideFloodingAreaFile: checklist.locationRisk.warehouseOutsideFloodingAreaDocument
              ? {
                  documentId: checklist.locationRisk.warehouseOutsideFloodingAreaFile,
                  originalFileName: checklist.locationRisk.warehouseOutsideFloodingAreaDocument.originalFileName ?? undefined,
                }
              : null,
          }
        : null,
      securityPerimeter: checklist.securityPerimeter
        ? {
            id: checklist.securityPerimeter.id,
            securedBoundaryWall: checklist.securityPerimeter.securedBoundaryWall,
            securedBoundaryWallFile: checklist.securityPerimeter.securedBoundaryWallDocument
              ? {
                  documentId: checklist.securityPerimeter.securedBoundaryWallFile,
                  originalFileName: checklist.securityPerimeter.securedBoundaryWallDocument.originalFileName ?? undefined,
                }
              : null,
            reinforcedBarbedWire: checklist.securityPerimeter.reinforcedBarbedWire,
            reinforcedBarbedWireFile: checklist.securityPerimeter.reinforcedBarbedWireDocument
              ? {
                  documentId: checklist.securityPerimeter.reinforcedBarbedWireFile,
                  originalFileName: checklist.securityPerimeter.reinforcedBarbedWireDocument.originalFileName ?? undefined,
                }
              : null,
            fullyGated: checklist.securityPerimeter.fullyGated,
            fullyGatedFile: checklist.securityPerimeter.fullyGatedDocument
              ? {
                  documentId: checklist.securityPerimeter.fullyGatedFile,
                  originalFileName: checklist.securityPerimeter.fullyGatedDocument.originalFileName ?? undefined,
                }
              : null,
            securityGuards24x7: checklist.securityPerimeter.securityGuards24x7,
            securityGuards24x7File: checklist.securityPerimeter.securityGuards24x7Document
              ? {
                  documentId: checklist.securityPerimeter.securityGuards24x7File,
                  originalFileName: checklist.securityPerimeter.securityGuards24x7Document.originalFileName ?? undefined,
                }
              : null,
            cctvCameras: checklist.securityPerimeter.cctvCameras,
            cctvCamerasFile: checklist.securityPerimeter.cctvCamerasDocument
              ? {
                  documentId: checklist.securityPerimeter.cctvCamerasFile,
                  originalFileName: checklist.securityPerimeter.cctvCamerasDocument.originalFileName ?? undefined,
                }
              : null,
          }
        : null,
      infrastructureUtilities: checklist.infrastructureUtilities
        ? {
            id: checklist.infrastructureUtilities.id,
            functionalWeighbridge: checklist.infrastructureUtilities.functionalWeighbridge,
            functionalWeighbridgeFile: checklist.infrastructureUtilities.functionalWeighbridgeDocument
              ? {
                  documentId: checklist.infrastructureUtilities.functionalWeighbridgeFile,
                  originalFileName: checklist.infrastructureUtilities.functionalWeighbridgeDocument.originalFileName ?? undefined,
                }
              : null,
            samplingTestingArea: checklist.infrastructureUtilities.samplingTestingArea,
            samplingTestingAreaFile: checklist.infrastructureUtilities.samplingTestingAreaDocument
              ? {
                  documentId: checklist.infrastructureUtilities.samplingTestingAreaFile,
                  originalFileName: checklist.infrastructureUtilities.samplingTestingAreaDocument.originalFileName ?? undefined,
                }
              : null,
            calibratedInstruments: checklist.infrastructureUtilities.calibratedInstruments,
            calibratedInstrumentsFile: checklist.infrastructureUtilities.calibratedInstrumentsDocument
              ? {
                  documentId: checklist.infrastructureUtilities.calibratedInstrumentsFile,
                  originalFileName: checklist.infrastructureUtilities.calibratedInstrumentsDocument.originalFileName ?? undefined,
                }
              : null,
            functionalOffice: checklist.infrastructureUtilities.functionalOffice,
            functionalOfficeFile: checklist.infrastructureUtilities.functionalOfficeDocument
              ? {
                  documentId: checklist.infrastructureUtilities.functionalOfficeFile,
                  originalFileName: checklist.infrastructureUtilities.functionalOfficeDocument.originalFileName ?? undefined,
                }
              : null,
            operationalToilets: checklist.infrastructureUtilities.operationalToilets,
            operationalToiletsFile: checklist.infrastructureUtilities.operationalToiletsDocument
              ? {
                  documentId: checklist.infrastructureUtilities.operationalToiletsFile,
                  originalFileName: checklist.infrastructureUtilities.operationalToiletsDocument.originalFileName ?? undefined,
                }
              : null,
            electricityGasUtilities: checklist.infrastructureUtilities.electricityGasUtilities,
            electricityGasUtilitiesFile: checklist.infrastructureUtilities.electricityGasUtilitiesDocument
              ? {
                  documentId: checklist.infrastructureUtilities.electricityGasUtilitiesFile,
                  originalFileName: checklist.infrastructureUtilities.electricityGasUtilitiesDocument.originalFileName ?? undefined,
                }
              : null,
            backupGenerator: checklist.infrastructureUtilities.backupGenerator,
            backupGeneratorFile: checklist.infrastructureUtilities.backupGeneratorDocument
              ? {
                  documentId: checklist.infrastructureUtilities.backupGeneratorFile,
                  originalFileName: checklist.infrastructureUtilities.backupGeneratorDocument.originalFileName ?? undefined,
                }
              : null,
            adequateResidentialArrangements: checklist.infrastructureUtilities.adequateResidentialArrangements,
            adequateResidentialArrangementsFile: checklist.infrastructureUtilities.adequateResidentialArrangementsDocument
              ? {
                  documentId: checklist.infrastructureUtilities.adequateResidentialArrangementsFile,
                  originalFileName: checklist.infrastructureUtilities.adequateResidentialArrangementsDocument.originalFileName ?? undefined,
                }
              : null,
            axialAerationFans: checklist.infrastructureUtilities.axialAerationFans,
            axialAerationFansFile: checklist.infrastructureUtilities.axialAerationFansDocument
              ? {
                  documentId: checklist.infrastructureUtilities.axialAerationFansFile,
                  originalFileName: checklist.infrastructureUtilities.axialAerationFansDocument.originalFileName ?? undefined,
                }
              : null,
            ventsExhaustFans: checklist.infrastructureUtilities.ventsExhaustFans,
            ventsExhaustFansFile: checklist.infrastructureUtilities.ventsExhaustFansDocument
              ? {
                  documentId: checklist.infrastructureUtilities.ventsExhaustFansFile,
                  originalFileName: checklist.infrastructureUtilities.ventsExhaustFansDocument.originalFileName ?? undefined,
                }
              : null,
            technicalDrawing: checklist.infrastructureUtilities.technicalDrawing,
            technicalDrawingFile: checklist.infrastructureUtilities.technicalDrawingDocument
              ? {
                  documentId: checklist.infrastructureUtilities.technicalDrawingFile,
                  originalFileName: checklist.infrastructureUtilities.technicalDrawingDocument.originalFileName ?? undefined,
                }
              : null,
            dryingFacility: checklist.infrastructureUtilities.dryingFacility,
            dryingFacilityFile: checklist.infrastructureUtilities.dryingFacilityDocument
              ? {
                  documentId: checklist.infrastructureUtilities.dryingFacilityFile,
                  originalFileName: checklist.infrastructureUtilities.dryingFacilityDocument.originalFileName ?? undefined,
                }
              : null,
            temperatureSensorCables: checklist.infrastructureUtilities.temperatureSensorCables,
            temperatureSensorCablesFile: checklist.infrastructureUtilities.temperatureSensorCablesDocument
              ? {
                  documentId: checklist.infrastructureUtilities.temperatureSensorCablesFile,
                  originalFileName: checklist.infrastructureUtilities.temperatureSensorCablesDocument.originalFileName ?? undefined,
                }
              : null,
          }
        : null,
      storageFacilities: checklist.storageFacilities
        ? {
            id: checklist.storageFacilities.id,
            securedDoors: checklist.storageFacilities.securedDoors,
            securedDoorsFile: checklist.storageFacilities.securedDoorsDocument
              ? {
                  documentId: checklist.storageFacilities.securedDoorsFile,
                  originalFileName: checklist.storageFacilities.securedDoorsDocument.originalFileName ?? undefined,
                }
              : null,
            plasteredFlooring: checklist.storageFacilities.plasteredFlooring,
            plasteredFlooringFile: checklist.storageFacilities.plasteredFlooringDocument
              ? {
                  documentId: checklist.storageFacilities.plasteredFlooringFile,
                  originalFileName: checklist.storageFacilities.plasteredFlooringDocument.originalFileName ?? undefined,
                }
              : null,
            plasteredWalls: checklist.storageFacilities.plasteredWalls,
            plasteredWallsFile: checklist.storageFacilities.plasteredWallsDocument
              ? {
                  documentId: checklist.storageFacilities.plasteredWallsFile,
                  originalFileName: checklist.storageFacilities.plasteredWallsDocument.originalFileName ?? undefined,
                }
              : null,
            intactCeiling: checklist.storageFacilities.intactCeiling,
            intactCeilingFile: checklist.storageFacilities.intactCeilingDocument
              ? {
                  documentId: checklist.storageFacilities.intactCeilingFile,
                  originalFileName: checklist.storageFacilities.intactCeilingDocument.originalFileName ?? undefined,
                }
              : null,
            functionalWindows: checklist.storageFacilities.functionalWindows,
            functionalWindowsFile: checklist.storageFacilities.functionalWindowsDocument
              ? {
                  documentId: checklist.storageFacilities.functionalWindowsFile,
                  originalFileName: checklist.storageFacilities.functionalWindowsDocument.originalFileName ?? undefined,
                }
              : null,
            protectiveNetting: checklist.storageFacilities.protectiveNetting,
            protectiveNettingFile: checklist.storageFacilities.protectiveNettingDocument
              ? {
                  documentId: checklist.storageFacilities.protectiveNettingFile,
                  originalFileName: checklist.storageFacilities.protectiveNettingDocument.originalFileName ?? undefined,
                }
              : null,
            functionalExhaustFans: checklist.storageFacilities.functionalExhaustFans,
            functionalExhaustFansFile: checklist.storageFacilities.functionalExhaustFansDocument
              ? {
                  documentId: checklist.storageFacilities.functionalExhaustFansFile,
                  originalFileName: checklist.storageFacilities.functionalExhaustFansDocument.originalFileName ?? undefined,
                }
              : null,
            freeFromPests: checklist.storageFacilities.freeFromPests,
            freeFromPestsFile: checklist.storageFacilities.freeFromPestsDocument
              ? {
                  documentId: checklist.storageFacilities.freeFromPestsFile,
                  originalFileName: checklist.storageFacilities.freeFromPestsDocument.originalFileName ?? undefined,
                }
              : null,
            fireSafetyMeasures: checklist.storageFacilities.fireSafetyMeasures,
            fireSafetyMeasuresFile: checklist.storageFacilities.fireSafetyMeasuresDocument
              ? {
                  documentId: checklist.storageFacilities.fireSafetyMeasuresFile,
                  originalFileName: checklist.storageFacilities.fireSafetyMeasuresDocument.originalFileName ?? undefined,
                }
              : null,
          }
        : null,
      registrationFee: checklist.registrationFee
        ? {
            id: checklist.registrationFee.id,
            bankPaymentSlip: checklist.registrationFee.bankPaymentSlipDocument
              ? {
                  documentId: checklist.registrationFee.bankPaymentSlip,
                  originalFileName: checklist.registrationFee.bankPaymentSlipDocument.originalFileName ?? undefined,
                }
              : null,
          }
        : null,
      declaration: checklist.declaration
        ? {
            id: checklist.declaration.id,
            informationTrueComplete: checklist.declaration.informationTrueComplete,
            authorizeVerification: checklist.declaration.authorizeVerification,
          }
        : null,
    };
  }

  async downloadWarehouseDocument(documentId: string) {
    const document = await this.warehouseDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const filename = path.basename(document.filePath);
    const fullPath = path.join(this.uploadDir, filename);

    if (!fsSync.existsSync(fullPath)) {
      throw new NotFoundException('File not found on disk');
    }

    const encryptedBuffer = fsSync.readFileSync(fullPath);

    let decryptedBuffer: Buffer;
    if (document.iv && document.authTag) {
      try {
        decryptedBuffer = decryptBuffer(encryptedBuffer, document.iv, document.authTag);
      } catch (error: any) {
        throw new BadRequestException(`Failed to decrypt document: ${error.message}`);
      }
    } else {
      decryptedBuffer = encryptedBuffer;
    }

    return {
      buffer: decryptedBuffer,
      mimeType: document.mimeType || 'application/octet-stream',
      filename: document.originalFileName,
    };
  }
}


