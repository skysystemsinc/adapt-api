import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FinancialInformationEntity } from './entities/financial-information.entity';
import { TaxReturnEntity } from './entities/financial/tax-return.entity';
import { BankStatementEntity } from './entities/financial/bank-statement.entity';
import { OthersEntity } from './entities/financial/others.entity';
import { AuditReportEntity } from './entities/financial/audit-report.entity';
import { WarehouseDocument } from './entities/warehouse-document.entity';
import { WarehouseOperatorApplicationRequest, WarehouseOperatorApplicationStatus } from './entities/warehouse-operator-application-request.entity';
import { OthersDto } from './dto/create-financial-information.dto';
import { WarehouseService } from './warehouse.service';
import { AuditReportHistoryEntity } from './entities/financial/audit-report-history.entity';
import { TaxReturnHistoryEntity } from './entities/financial/tax-return-history.entity';
import { BankStatementHistoryEntity } from './entities/financial/bank-statement-history.entity';
import { OthersHistoryEntity } from './entities/financial/others-history.entity';
import { AssignmentLevel } from './operator/assignment/entities/assignment.entity';
import { AssignmentStatus } from '../../utilites/enum';

@Injectable()
export class FinancialInformationService {
  constructor(
    @InjectRepository(FinancialInformationEntity)
    private readonly financialInformationRepository: Repository<FinancialInformationEntity>,
    @InjectRepository(TaxReturnEntity)
    private readonly taxReturnRepository: Repository<TaxReturnEntity>,
    @InjectRepository(BankStatementEntity)
    private readonly bankStatementRepository: Repository<BankStatementEntity>,
    @InjectRepository(OthersEntity)
    private readonly othersRepository: Repository<OthersEntity>,
    @InjectRepository(AuditReportEntity)
    private readonly auditReportRepository: Repository<AuditReportEntity>,
    @InjectRepository(WarehouseDocument)
    private readonly warehouseDocumentRepository: Repository<WarehouseDocument>,
    @InjectRepository(WarehouseOperatorApplicationRequest)
    private readonly warehouseOperatorRepository: Repository<WarehouseOperatorApplicationRequest>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => WarehouseService))
    private readonly warehouseService: WarehouseService,
  ) {}

  /**
   * Unified method to save or update a financial subsection
   * Supports: audit-report, tax-return, bank-statement, other
   */
  async saveFinancialSubsection(
    sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    applicationId: string,
    dto: any,
    userId: string,
    id?: string,
  ) {
    if (!dto) {
      throw new BadRequestException('Request body is required');
    }

    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // Ensure financial information context exists
    let financialInfo = await this.financialInformationRepository.findOne({
      where: { applicationId: application.id },
    });

    if (!financialInfo) {
      // Create financial information context if it doesn't exist
      financialInfo = this.financialInformationRepository.create({
        applicationId: application.id,
      });
      await this.financialInformationRepository.save(financialInfo);
    }

    switch (sectionType) {
      case 'audit-report':
        return this.saveAuditReport(financialInfo, dto, userId, id);
      case 'tax-return':
        return this.saveTaxReturn(financialInfo, dto, userId, id);
      case 'bank-statement':
        return this.saveBankStatement(financialInfo, dto, userId, id);
      case 'other':
        return this.saveOther(applicationId, dto, userId, id);
      default:
        throw new BadRequestException(`Invalid section type: ${sectionType}`);
    }
  }

  /**
   * Save or update audit report
   * Supports multiple documents for audit-report
   */
  private async saveAuditReport(
    financialInfo: FinancialInformationEntity,
    dto: any,
    userId: string,
    id?: string,
  ) {
    if (!dto) {
      throw new BadRequestException('Request body is required');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const auditReportRepo = manager.getRepository(AuditReportEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const historyRepo = manager.getRepository(AuditReportHistoryEntity);
      
      const appInTransaction = await appRepo.findOne({
        where: { id: financialInfo.applicationId, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }
      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update audit report after application is approved, submitted, or rejected');
      }

      // Handle documents from DTO: can be base64 strings or document IDs
      // Note: We'll handle file uploads outside the transaction since file operations are not transactional
      let filesToUpload: any[] = [];
      let documentIdsToKeep: string[] = [];
      
      if (dto?.documents && Array.isArray(dto.documents)) {
        const fileNames = dto.documentFileNames || [];
        const mimeTypes = dto.documentMimeTypes || [];
        
        dto.documents.forEach((doc: string, index: number) => {
          if (typeof doc === 'string') {
            // Check if it's base64 (contains data URL prefix) or document ID
            if (doc.includes('base64') || doc.includes(',')) {
              // It's base64 - will convert to file and upload outside transaction
              if (!fileNames[index]) {
                throw new BadRequestException(`documentFileNames[${index}] is required when documents[${index}] is provided as base64`);
              }
              
              const fileForUpload = this.warehouseService.convertBase64ToFile(
                doc,
                fileNames[index],
                mimeTypes[index]
              );
              filesToUpload.push(fileForUpload);
            } else {
              // It's a document ID string - use it directly
              documentIdsToKeep.push(doc);
            }
          }
        });
      }

      if (id) {
        // Update existing
        const existing = await auditReportRepo.findOne({
          where: { id, financialInformationId: financialInfo.id },
          relations: ['document'],
        });

        if (!existing) {
          throw new NotFoundException('Audit report not found');
        }

        if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
          throw new BadRequestException('Cannot update audit report after application is approved, submitted, or rejected');
        }

        if(appInTransaction.status === WarehouseOperatorApplicationStatus.REJECTED) {
          //save history of audit report
          const historyRecord = historyRepo.create({
            auditReportId: existing.id,
            documentType: existing.documentType,
            documentName: existing.documentName,
            periodStart: existing.periodStart,
            periodEnd: existing.periodEnd,
            assets: existing.assets,
            liabilities: existing.liabilities,
            equity: existing.equity,
            revenue: existing.revenue,
            netProfitLoss: existing.netProfitLoss,
            remarks: existing.remarks ?? null,
            financialInformationId: financialInfo.id,
            document: existing.document,
            isActive: false,
          });
          // Preserve the original createdAt timestamp from the audit report record
          historyRecord.createdAt = existing.createdAt;
          await historyRepo.save(historyRecord);
        }

        Object.assign(existing, {
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          assets: dto.assets,
          liabilities: dto.liabilities,
          equity: dto.equity,
          revenue: dto.revenue,
          netProfitLoss: dto.netProfitLoss,
          remarks: dto.remarks ?? null,
        });

        // Handle multiple documents
        if (filesToUpload.length > 0 || documentIdsToKeep.length > 0) {
          // Delete old documents that are not in the keep list
          // Find all existing documents for this audit report
          const existingDocuments = await documentRepo.find({
            where: {
              documentableType: 'AuditReport',
              documentableId: existing.id,
            },
          });

          // Delete documents that are not in the keep list
          const documentsToDelete = existingDocuments.filter(
            (doc) => !documentIdsToKeep.includes(doc.id)
          );
          if (documentsToDelete.length > 0) {
            await documentRepo.remove(documentsToDelete);
          }

          // Upload new files (filesToUpload contains file-like objects from base64 conversion)
          let firstDocument: WarehouseDocument | null = null;
          for (const file of filesToUpload) {
            const doc = await this.warehouseService.uploadWarehouseDocument(
              file,
              userId,
              'AuditReport',
              existing.id,
              'document',
            );
            const documentEntity = await documentRepo.findOne({ where: { id: doc.id } });
            if (documentEntity) {
              if (!firstDocument) {
                firstDocument = documentEntity;
              }
            }
          }

          // Set the first document (or first from keep list) as the primary document for backward compatibility
          if (firstDocument) {
            existing.document = firstDocument;
          } else if (documentIdsToKeep.length > 0) {
            const firstDocToKeep = await documentRepo.findOne({
              where: { id: documentIdsToKeep[0] },
            });
            if (firstDocToKeep) {
              existing.document = firstDocToKeep;
            }
          }
        }

        await auditReportRepo.save(existing);
        return existing;
      } else {
        // Create new
        const auditReport = auditReportRepo.create({
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          assets: dto.assets,
          liabilities: dto.liabilities,
          equity: dto.equity,
          revenue: dto.revenue,
          netProfitLoss: dto.netProfitLoss,
          remarks: dto.remarks ?? undefined,
          financialInformationId: financialInfo.id,
        });
        await auditReportRepo.save(auditReport);

        // Update financial info with audit report
        financialInfo.auditReportId = auditReport.id;
        await manager.getRepository(FinancialInformationEntity).save(financialInfo);

        // Upload new files (filesToUpload contains file-like objects from base64 conversion)
        let firstDocument: WarehouseDocument | null = null;
        for (const file of filesToUpload) {
          const doc = await this.warehouseService.uploadWarehouseDocument(
            file,
            userId,
            'AuditReport',
            auditReport.id,
            'document',
          );
          const documentEntity = await documentRepo.findOne({ where: { id: doc.id } });
          if (documentEntity) {
            if (!firstDocument) {
              firstDocument = documentEntity;
            }
          }
        }

        // Set the first document as the primary document for backward compatibility
        if (firstDocument) {
          auditReport.document = firstDocument;
          await auditReportRepo.save(auditReport);
        }

        return auditReport;
      }
    });

    // Reload the entity with document relation to return complete data
    const resultWithDocument = await this.dataSource.getRepository(AuditReportEntity).findOne({
      where: { id: savedResult.id },
      relations: ['document'],
    });

    // Get all documents for this audit report (polymorphic relationship)
    const allDocuments = await this.dataSource.getRepository(WarehouseDocument).find({
      where: {
        documentableType: 'AuditReport',
        documentableId: savedResult.id,
      },
      order: {
        createdAt: 'ASC', // Order by creation time
      },
    });

    // Map documents to response format
    const documentsArray = allDocuments.map((doc) => ({
      documentId: doc.id,
      originalFileName: doc.originalFileName ?? undefined,
    }));

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: financialInfo.applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.warehouseService['assignmentRepository'].find({
        where: {
          applicationId: financialInfo.applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the audit report ID to find the specific assignment section
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: savedResult.id, // Use audit report ID, not financialInfo.id
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the audit report ID (savedResult.id) to match assignment section resourceId
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        financialInfo.applicationId,
        '5-financial-information',
        savedResult.id, // Use audit report ID, not financialInfo.id
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Audit report updated successfully' : 'Audit report saved successfully',
      data: {
        id: savedResult.id,
        documentType: savedResult.documentType,
        documentName: savedResult.documentName,
        periodStart: savedResult.periodStart,
        periodEnd: savedResult.periodEnd,
        assets: savedResult.assets,
        liabilities: savedResult.liabilities,
        equity: savedResult.equity,
        revenue: savedResult.revenue,
        netProfitLoss: savedResult.netProfitLoss,
        remarks: savedResult.remarks ?? null,
        // Keep single document for backward compatibility
        document: resultWithDocument?.document && resultWithDocument.document.id
          ? {
              documentId: resultWithDocument.document.id,
              originalFileName: resultWithDocument.document.originalFileName ?? undefined,
            }
          : null,
        // Include all documents array
        documents: documentsArray.length > 0 ? documentsArray : undefined,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Save or update tax return
   * Supports multiple documents for tax-return
   */
  private async saveTaxReturn(
    financialInfo: FinancialInformationEntity,
    dto: any,
    userId: string,
    id?: string,
  ) {
    if (!dto) {
      throw new BadRequestException('Request body is required');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const taxReturnRepo = manager.getRepository(TaxReturnEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const historyRepo = manager.getRepository(TaxReturnHistoryEntity);

      // Handle documents from DTO: can be base64 strings or document IDs
      // Note: We'll handle file uploads inside the transaction (files are converted from base64 before transaction)
      let filesToUpload: any[] = [];
      let documentIdsToKeep: string[] = [];
      
      if (dto?.documents && Array.isArray(dto.documents)) {
        const fileNames = dto.documentFileNames || [];
        const mimeTypes = dto.documentMimeTypes || [];
        
        dto.documents.forEach((doc: string, index: number) => {
          if (typeof doc === 'string') {
            // Check if it's base64 (contains data URL prefix) or document ID
            if (doc.includes('base64') || doc.includes(',')) {
              // It's base64 - convert to file-like object
              if (!fileNames[index]) {
                throw new BadRequestException(`documentFileNames[${index}] is required when documents[${index}] is provided as base64`);
              }
              
              const fileForUpload = this.warehouseService.convertBase64ToFile(
                doc,
                fileNames[index],
                mimeTypes[index]
              );
              filesToUpload.push(fileForUpload);
            } else {
              // It's a document ID string - use it directly
              documentIdsToKeep.push(doc);
            }
          }
        });
      }

      if (id) {
        // Update existing
        const existing = await taxReturnRepo.findOne({
          where: { id, financialInformationId: financialInfo.id },
          relations: ['document'],
        });

        if (!existing) {
          throw new NotFoundException('Tax return not found');
        }

        // Get application to check status
        const appInTransaction = await appRepo.findOne({
          where: { id: financialInfo.applicationId },
        });

        if (!appInTransaction) {
          throw new NotFoundException('Application not found');
        }

        // Save history of tax return if application is rejected (before overwriting)
        if (appInTransaction.status === WarehouseOperatorApplicationStatus.REJECTED) {
          const historyRecord = historyRepo.create({
            taxReturnId: existing.id,
            documentType: existing.documentType,
            documentName: existing.documentName,
            periodStart: existing.periodStart,
            periodEnd: existing.periodEnd,
            remarks: existing.remarks ?? null,
            financialInformationId: financialInfo.id,
            document: existing.document,
            isActive: false,
          });
          // Preserve the original createdAt timestamp from the tax return record
          historyRecord.createdAt = existing.createdAt;
          await historyRepo.save(historyRecord);
        }

        Object.assign(existing, {
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          remarks: dto.remarks ?? null,
        });

        // Handle multiple documents
        if (filesToUpload.length > 0 || documentIdsToKeep.length > 0) {
          // Delete old documents that are not in the keep list
          // Find all existing documents for this tax return
          const existingDocuments = await documentRepo.find({
            where: {
              documentableType: 'TaxReturn',
              documentableId: existing.id,
            },
          });

          // Delete documents that are not in the keep list
          const documentsToDelete = existingDocuments.filter(
            (doc) => !documentIdsToKeep.includes(doc.id)
          );
          if (documentsToDelete.length > 0) {
            await documentRepo.remove(documentsToDelete);
          }

          // Upload new files
          let firstDocument: WarehouseDocument | null = null;
          for (const file of filesToUpload) {
            const doc = await this.warehouseService.uploadWarehouseDocument(
              file,
              userId,
              'TaxReturn',
              existing.id,
              'document',
            );
            const documentEntity = await documentRepo.findOne({ where: { id: doc.id } });
            if (documentEntity) {
              if (!firstDocument) {
                firstDocument = documentEntity;
              }
            }
          }

          // Set the first document (or first from keep list) as the primary document for backward compatibility
          if (firstDocument) {
            existing.document = firstDocument;
          } else if (documentIdsToKeep.length > 0) {
            const firstDocToKeep = await documentRepo.findOne({
              where: { id: documentIdsToKeep[0] },
            });
            if (firstDocToKeep) {
              existing.document = firstDocToKeep;
            }
          }
        }

        await taxReturnRepo.save(existing);
        return existing;
      } else {
        // Create new - at least one document is required
        if (filesToUpload.length === 0 && documentIdsToKeep.length === 0) {
          throw new BadRequestException('At least one document is required for tax return. Please upload a document.');
        }

        const taxReturn = taxReturnRepo.create({
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          remarks: dto.remarks ?? undefined,
          financialInformationId: financialInfo.id,
        });
        await taxReturnRepo.save(taxReturn);

        // Upload new files
        let firstDocument: WarehouseDocument | null = null;
        for (const file of filesToUpload) {
          const doc = await this.warehouseService.uploadWarehouseDocument(
            file,
            userId,
            'TaxReturn',
            taxReturn.id,
            'document',
          );
          const documentEntity = await documentRepo.findOne({ where: { id: doc.id } });
          if (documentEntity) {
            if (!firstDocument) {
              firstDocument = documentEntity;
            }
          }
        }

        // Set the first document as the primary document for backward compatibility
        if (firstDocument) {
          taxReturn.document = firstDocument;
          await taxReturnRepo.save(taxReturn);
        }

        return taxReturn;
      }
    });

    // Reload the entity with document relation to return complete data
    const resultWithDocument = await this.dataSource.getRepository(TaxReturnEntity).findOne({
      where: { id: savedResult.id },
      relations: ['document'],
    });

    // Get all documents for this tax return (polymorphic relationship)
    const allDocuments = await this.dataSource.getRepository(WarehouseDocument).find({
      where: {
        documentableType: 'TaxReturn',
        documentableId: savedResult.id,
      },
      order: {
        createdAt: 'ASC', // Order by creation time
      },
    });

    // Map documents to response format
    const documentsArray = allDocuments.map((doc) => ({
      documentId: doc.id,
      originalFileName: doc.originalFileName ?? undefined,
    }));

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: financialInfo.applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.warehouseService['assignmentRepository'].find({
        where: {
          applicationId: financialInfo.applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the tax return ID to find the specific assignment section
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: savedResult.id, // Use tax return ID, not financialInfo.id
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the tax return ID (savedResult.id) to match assignment section resourceId
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        financialInfo.applicationId,
        '5-financial-information',
        savedResult.id, // Use tax return ID, not financialInfo.id
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Tax return updated successfully' : 'Tax return saved successfully',
      data: {
        id: savedResult.id,
        documentType: savedResult.documentType,
        documentName: savedResult.documentName,
        periodStart: savedResult.periodStart,
        periodEnd: savedResult.periodEnd,
        remarks: savedResult.remarks ?? null,
        // Keep single document for backward compatibility
        document: resultWithDocument?.document && resultWithDocument.document.id
          ? {
              documentId: resultWithDocument.document.id,
              originalFileName: resultWithDocument.document.originalFileName ?? undefined,
            }
          : null,
        // Include all documents array
        documents: documentsArray.length > 0 ? documentsArray : undefined,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Save or update bank statement
   */
  private async saveBankStatement(
    financialInfo: FinancialInformationEntity,
    dto: any,
    userId: string,
    id?: string,
  ) {
    if (!dto) {
      throw new BadRequestException('Request body is required');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const bankStatementRepo = manager.getRepository(BankStatementEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const historyRepo = manager.getRepository(BankStatementHistoryEntity);

      if (id) {
        // Update existing
        const existing = await bankStatementRepo.findOne({
          where: { id, financialInformationId: financialInfo.id },
          relations: ['document'],
        });

        if (!existing) {
          throw new NotFoundException('Bank statement not found');
        }

        // Get application to check status
        const appInTransaction = await appRepo.findOne({
          where: { id: financialInfo.applicationId },
        });

        if (!appInTransaction) {
          throw new NotFoundException('Application not found');
        }

        // Save history of bank statement if application is rejected (before overwriting)
        if (appInTransaction.status === WarehouseOperatorApplicationStatus.REJECTED) {
          const historyRecord = historyRepo.create({
            bankStatementId: existing.id,
            documentType: existing.documentType,
            documentName: existing.documentName,
            periodStart: existing.periodStart,
            periodEnd: existing.periodEnd,
            remarks: existing.remarks ?? null,
            financialInformationId: financialInfo.id,
            document: existing.document,
            isActive: false,
          });
          // Preserve the original createdAt timestamp from the bank statement record
          historyRecord.createdAt = existing.createdAt;
          await historyRepo.save(historyRecord);
        }

        Object.assign(existing, {
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          remarks: dto.remarks ?? null,
        });

        // Handle document: if base64 is provided, convert and upload; if string (documentId), use it
        // Note: We'll handle the upload inside the transaction (file is converted from base64 before transaction)
        let documentFileForUpload: any = undefined;
        let documentIdToUse: string | undefined = undefined;
        
        if (dto.document) {
          // Check if it's base64 (contains data URL prefix) or document ID
          if (dto.document.includes('base64') || dto.document.includes(',')) {
            // It's base64 - convert to file-like object
            if (!dto.documentFileName) {
              throw new BadRequestException('documentFileName is required when document is provided as base64');
            }
            
            documentFileForUpload = this.warehouseService.convertBase64ToFile(
              dto.document,
              dto.documentFileName,
              dto.documentMimeType
            );
          } else {
            // It's a document ID string - use it directly
            documentIdToUse = dto.document;
          }
        }

        if (documentFileForUpload) {
          // Upload new document (replace existing if any)
          const doc = await this.warehouseService.uploadWarehouseDocument(
            documentFileForUpload,
            userId,
            'BankStatement',
            existing.id,
            'document',
          );
          const documentEntity = await documentRepo.findOne({ where: { id: doc.id } });
          if (documentEntity) {
            existing.document = documentEntity;
          }
        } else if (documentIdToUse) {
          // Use existing document ID
          const documentEntity = await documentRepo.findOne({ where: { id: documentIdToUse } });
          if (documentEntity) {
            existing.document = documentEntity;
          }
        }

        await bankStatementRepo.save(existing);
        return existing;
      } else {
        // Create new - document is required
        if (!dto.document) {
          throw new BadRequestException('Document is required for bank statement. Please provide a document.');
        }

        // Handle document: if base64 is provided, convert and upload; if string (documentId), use it
        let documentFileForUpload: any = undefined;
        let documentIdToUse: string | undefined = undefined;
        
        // Check if it's base64 (contains data URL prefix) or document ID
        if (dto.document.includes('base64') || dto.document.includes(',')) {
          // It's base64 - convert to file-like object
          if (!dto.documentFileName) {
            throw new BadRequestException('documentFileName is required when document is provided as base64');
          }
          
          documentFileForUpload = this.warehouseService.convertBase64ToFile(
            dto.document,
            dto.documentFileName,
            dto.documentMimeType
          );
        } else {
          // It's a document ID string - use it directly
          documentIdToUse = dto.document;
        }

        const bankStatement = bankStatementRepo.create({
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          remarks: dto.remarks ?? undefined,
          financialInformationId: financialInfo.id,
        });
        await bankStatementRepo.save(bankStatement);

        // Handle document upload after creating the entity
        if (documentFileForUpload) {
          const doc = await this.warehouseService.uploadWarehouseDocument(
            documentFileForUpload,
            userId,
            'BankStatement',
            bankStatement.id,
            'document',
          );
          const documentEntity = await documentRepo.findOne({ where: { id: doc.id } });
          if (documentEntity) {
            bankStatement.document = documentEntity;
            await bankStatementRepo.save(bankStatement);
          }
        } else if (documentIdToUse) {
          const documentEntity = await documentRepo.findOne({ where: { id: documentIdToUse } });
          if (documentEntity) {
            bankStatement.document = documentEntity;
            await bankStatementRepo.save(bankStatement);
          }
        }

        return bankStatement;
      }
    });

    // Reload the entity with document relation to return complete data
    const resultWithDocument = await this.dataSource.getRepository(BankStatementEntity).findOne({
      where: { id: savedResult.id },
      relations: ['document'],
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: financialInfo.applicationId },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.warehouseService['assignmentRepository'].find({
        where: {
          applicationId: financialInfo.applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the bank statement ID to find the specific assignment section
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: savedResult.id, // Use bank statement ID, not financialInfo.id
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the bank statement ID (savedResult.id) to match assignment section resourceId
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        financialInfo.applicationId,
        '5-financial-information',
        savedResult.id, // Use bank statement ID, not financialInfo.id
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Bank statement updated successfully' : 'Bank statement saved successfully',
      data: {
        id: savedResult.id,
        documentType: savedResult.documentType,
        documentName: savedResult.documentName,
        periodStart: savedResult.periodStart,
        periodEnd: savedResult.periodEnd,
        remarks: savedResult.remarks ?? null,
        document: resultWithDocument?.document && resultWithDocument.document.id
          ? {
              documentId: resultWithDocument.document.id,
              originalFileName: resultWithDocument.document.originalFileName ?? undefined,
            }
          : null,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Save or update other document
   */
  async saveOther(
    applicationId: string,
    dto: OthersDto & { document?: string | { documentId?: string; id?: string } },
    userId: string,
    id?: string,
  ) {
    if (!dto) {
      throw new BadRequestException('Request body is required');
    }

    const application = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new NotFoundException('Warehouse operator application not found. Please create an application first.');
    }

    // Ensure financial information context exists
    // Financial information must be created first via the main createFinancialInformation endpoint
    const financialInfo = await this.financialInformationRepository.findOne({
      where: { applicationId: application.id },
    });

    if (!financialInfo) {
      throw new NotFoundException('Financial information not found. Please create financial information first by completing the audit report, tax return, and bank statement sections.');
    }

    const savedResult = await this.dataSource.transaction(async (manager) => {
      const othersRepo = manager.getRepository(OthersEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const historyRepo = manager.getRepository(OthersHistoryEntity);

      const assignDocument = async (
        documentId: string | undefined | null,
        documentableType: string,
        documentType: string,
        documentableId: string,
      ) => {
        if (!documentId) {
          return;
        }

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

      if (id) {
        // Update existing
        const existing = await othersRepo.findOne({
          where: { id, financialInformationId: financialInfo.id },
          relations: ['document'],
        });

        if (!existing) {
          throw new NotFoundException('Other document not found');
        }

        // Get application to check status
        const appInTransaction = await appRepo.findOne({
          where: { id: application.id },
        });

        if (!appInTransaction) {
          throw new NotFoundException('Application not found');
        }

        // Save history of other document if application is rejected (before overwriting)
        if (appInTransaction.status === WarehouseOperatorApplicationStatus.REJECTED) {
          const historyRecord = historyRepo.create({
            othersId: existing.id,
            documentType: existing.documentType,
            documentName: existing.documentName,
            periodStart: existing.periodStart,
            periodEnd: existing.periodEnd,
            remarks: existing.remarks ?? null,
            financialInformationId: financialInfo.id,
            document: existing.document,
            isActive: false,
          });
          // Preserve the original createdAt timestamp from the other document record
          historyRecord.createdAt = existing.createdAt;
          await historyRepo.save(historyRecord);
        }

        Object.assign(existing, {
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          remarks: dto.remarks ?? null,
        });

        // Handle document: if base64 is provided, convert and upload; if string (documentId), use it
        // Note: We'll handle the upload inside the transaction (file is converted from base64 before transaction)
        let documentFileForUpload: any = undefined;
        let documentIdToUse: string | undefined = undefined;
        
        if (dto.document) {
          // Handle both string (base64 or documentId) and object (legacy format)
          let documentValue: string | undefined = undefined;
          if (typeof dto.document === 'string') {
            documentValue = dto.document;
          } else if (dto.document && typeof dto.document === 'object' && 'documentId' in dto.document) {
            documentValue = (dto.document as any).documentId || (dto.document as any).id;
          }
          
          if (documentValue) {
            // Check if it's base64 (contains data URL prefix) or document ID
            if (documentValue.includes('base64') || documentValue.includes(',')) {
              // It's base64 - convert to file-like object
              if (!dto.documentFileName) {
                throw new BadRequestException('documentFileName is required when document is provided as base64');
              }
              
              documentFileForUpload = this.warehouseService.convertBase64ToFile(
                documentValue,
                dto.documentFileName,
                dto.documentMimeType
              );
            } else {
              // It's a document ID string - use it directly
              documentIdToUse = documentValue;
            }
          }
        }

        // Handle document upload/update
        if (documentFileForUpload) {
          // Upload new document (replace existing if any)
          const doc = await this.warehouseService.uploadWarehouseDocument(
            documentFileForUpload,
            userId,
            'FinancialOthers',
            existing.id,
            'document',
          );
          
          // Get the document entity
          const documentEntity = await documentRepo.findOne({
            where: { id: doc.id },
          });

          if (documentEntity) {
            existing.document = documentEntity;
          }
        } else if (documentIdToUse) {
          // Use existing document ID
          const documentEntity = await documentRepo.findOne({
            where: { id: documentIdToUse },
          });

          if (documentEntity) {
            existing.document = documentEntity;
          }
        }

        await othersRepo.save(existing);

        return existing;
      } else {
        // Create new - document is required
        if (!dto.document) {
          throw new BadRequestException('Document is required for other document. Please provide a document.');
        }

        // Handle document: if base64 is provided, convert and upload; if string (documentId), use it
        let documentFileForUpload: any = undefined;
        let documentIdToUse: string | undefined = undefined;
        
        // Handle both string (base64 or documentId) and object (legacy format)
        let documentValue: string | undefined = undefined;
        if (typeof dto.document === 'string') {
          documentValue = dto.document;
        } else if (dto.document && typeof dto.document === 'object' && 'documentId' in dto.document) {
          documentValue = (dto.document as any).documentId || (dto.document as any).id;
        }
        
        if (documentValue) {
          // Check if it's base64 (contains data URL prefix) or document ID
          if (documentValue.includes('base64') || documentValue.includes(',')) {
            // It's base64 - convert to file-like object
            if (!dto.documentFileName) {
              throw new BadRequestException('documentFileName is required when document is provided as base64');
            }
            
            documentFileForUpload = this.warehouseService.convertBase64ToFile(
              documentValue,
              dto.documentFileName,
              dto.documentMimeType
            );
          } else {
            // It's a document ID string - use it directly
            documentIdToUse = documentValue;
          }
        }

        const other = othersRepo.create({
          documentType: dto.documentType,
          documentName: dto.documentName,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          remarks: dto.remarks ?? undefined,
          financialInformationId: financialInfo.id,
        });
        await othersRepo.save(other);

        // Handle document upload after creating the entity
        if (documentFileForUpload) {
          const doc = await this.warehouseService.uploadWarehouseDocument(
            documentFileForUpload,
            userId,
            'FinancialOthers',
            other.id,
            'document',
          );
          
          // Get the document entity
          const documentEntity = await documentRepo.findOne({
            where: { id: doc.id },
          });

          if (documentEntity) {
            other.document = documentEntity;
            await othersRepo.save(other);
          }
        } else if (documentIdToUse) {
          const documentEntity = await documentRepo.findOne({
            where: { id: documentIdToUse },
          });

          if (documentEntity) {
            other.document = documentEntity;
            await othersRepo.save(other);
          }
        }

        return other;
      }
    });

    // Reload the entity with document relation to return complete data
    const resultWithDocument = await this.dataSource.getRepository(OthersEntity).findOne({
      where: { id: savedResult.id },
      relations: ['document'],
    });

    // Reload application to get latest status after transaction
    const updatedApplication = await this.warehouseOperatorRepository.findOne({
      where: { id: applicationId },
    });

    // Reload financial info to ensure we have the latest data
    const currentFinancialInfo = await this.financialInformationRepository.findOne({
      where: { applicationId: application?.id },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED && currentFinancialInfo && application) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.warehouseService['assignmentRepository'].find({
        where: {
          applicationId: applicationId,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        // Use the other document ID to find the specific assignment section
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: savedResult.id, // Use other document ID, not currentFinancialInfo.id
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      // Use the other document ID (savedResult.id) to match assignment section resourceId
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        applicationId,
        '5-financial-information',
        savedResult.id, // Use other document ID, not currentFinancialInfo.id
        assignmentSectionId ?? undefined,
      );
    }

    return {
      message: id ? 'Other document updated successfully' : 'Other document saved successfully',
      data: {
        id: savedResult.id,
        documentType: savedResult.documentType,
        documentName: savedResult.documentName,
        periodStart: savedResult.periodStart,
        periodEnd: savedResult.periodEnd,
        remarks: savedResult.remarks ?? null,
        document: resultWithDocument?.document && resultWithDocument.document.id
          ? {
              documentId: resultWithDocument.document.id,
              originalFileName: resultWithDocument.document.originalFileName ?? undefined,
            }
          : null,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Unified method to delete a financial subsection
   */
  async deleteFinancialSubsection(
    sectionType: 'audit-report' | 'tax-return' | 'bank-statement' | 'other',
    id: string,
    userId: string,
  ) {
    switch (sectionType) {
      case 'audit-report':
        return this.deleteAuditReport(id, userId);
      case 'tax-return':
        return this.deleteTaxReturn(id, userId);
      case 'bank-statement':
        return this.deleteBankStatement(id, userId);
      case 'other':
        return this.deleteOther(id, userId);
      default:
        throw new BadRequestException(`Invalid section type: ${sectionType}`);
    }
  }

  /**
   * Delete audit report
   */
  private async deleteAuditReport(id: string, userId: string) {
    const auditReport = await this.dataSource.getRepository(AuditReportEntity).findOne({
      where: { id },
      relations: ['financialInformation', 'financialInformation.application'],
    });

    if (!auditReport) {
      throw new NotFoundException('Audit report not found');
    }

    if (auditReport.financialInformation?.application?.userId !== userId) {
      throw new BadRequestException('You are not allowed to delete this audit report');
    }

    await this.dataSource.getRepository(AuditReportEntity).remove(auditReport);

    return {
      message: 'Audit report deleted successfully',
      success: true,
    };
  }

  /**
   * Delete tax return
   */
  private async deleteTaxReturn(id: string, userId: string) {
    const taxReturn = await this.dataSource.getRepository(TaxReturnEntity).findOne({
      where: { id },
      relations: ['financialInformation', 'financialInformation.application'],
    });

    if (!taxReturn) {
      throw new NotFoundException('Tax return not found');
    }

    if (taxReturn.financialInformation?.application?.userId !== userId) {
      throw new BadRequestException('You are not allowed to delete this tax return');
    }

    await this.dataSource.getRepository(TaxReturnEntity).remove(taxReturn);

    return {
      message: 'Tax return deleted successfully',
      success: true,
    };
  }

  /**
   * Delete bank statement
   */
  private async deleteBankStatement(id: string, userId: string) {
    const bankStatement = await this.dataSource.getRepository(BankStatementEntity).findOne({
      where: { id },
      relations: ['financialInformation', 'financialInformation.application'],
    });

    if (!bankStatement) {
      throw new NotFoundException('Bank statement not found');
    }

    if (bankStatement.financialInformation?.application?.userId !== userId) {
      throw new BadRequestException('You are not allowed to delete this bank statement');
    }

    await this.dataSource.getRepository(BankStatementEntity).remove(bankStatement);

    return {
      message: 'Bank statement deleted successfully',
      success: true,
    };
  }

  /**
   * Delete an other document
   */
  async deleteOther(id: string, userId: string) {
    const other = await this.dataSource.getRepository(OthersEntity).findOne({
      where: { id },
      relations: ['financialInformation', 'financialInformation.application'],
    });

    if (!other) {
      throw new NotFoundException('Other document not found');
    }

    if (other.financialInformation?.application?.userId !== userId) {
      throw new BadRequestException('You are not allowed to delete this other document');
    }

    await this.dataSource.getRepository(OthersEntity).remove(other);

    return {
      message: 'Other document deleted successfully',
      success: true,
    };
  }
}

