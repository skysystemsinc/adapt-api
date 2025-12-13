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
import { AssignmentLevel, AssignmentStatus } from './operator/assignment/entities/assignment.entity';

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
    documentFile?: any,
  ) {
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
        return this.saveAuditReport(financialInfo, dto, userId, id, documentFile);
      case 'tax-return':
        return this.saveTaxReturn(financialInfo, dto, userId, id, documentFile);
      case 'bank-statement':
        return this.saveBankStatement(financialInfo, dto, userId, id, documentFile);
      case 'other':
        return this.saveOther(applicationId, dto, userId, id, documentFile);
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
    documentFiles?: any, // Can be single file, array of files, or array of document IDs
  ) {
    const savedResult = await this.dataSource.transaction(async (manager) => {
      const auditReportRepo = manager.getRepository(AuditReportEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const historyRepo = manager.getRepository(AuditReportHistoryEntity);
      
      const appInTransaction = await appRepo.findOne({
        where: { id: financialInfo.application.id, userId },
      });
      if (!appInTransaction) {
        throw new NotFoundException('Application not found');
      }
      if (![WarehouseOperatorApplicationStatus.DRAFT, WarehouseOperatorApplicationStatus.RESUBMITTED, WarehouseOperatorApplicationStatus.REJECTED].includes(appInTransaction.status)) {
        throw new BadRequestException('Cannot update audit report after application is approved, submitted, or rejected');
      }

      // Normalize documentFiles to array
      let filesToUpload: any[] = [];
      let documentIdsToKeep: string[] = [];
      
      if (documentFiles) {
        if (Array.isArray(documentFiles)) {
          // Check if array contains files or document IDs
          documentFiles.forEach((item) => {
            if (item && typeof item === 'object' && item.buffer) {
              // It's a file
              filesToUpload.push(item);
            } else if (typeof item === 'string') {
              // It's a document ID
              documentIdsToKeep.push(item);
            }
          });
        } else if (documentFiles.buffer) {
          // Single file
          filesToUpload = [documentFiles];
        } else if (typeof documentFiles === 'string') {
          // Single document ID
          documentIdsToKeep = [documentFiles];
        }
      }

      // Also check dto.documents for document IDs (from frontend)
      if (dto.documents && Array.isArray(dto.documents)) {
        dto.documents.forEach((docId: string) => {
          if (typeof docId === 'string' && !documentIdsToKeep.includes(docId)) {
            documentIdsToKeep.push(docId);
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

          // Upload new files
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

        // Upload new files
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
      where: { id: financialInfo.application.id },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.warehouseService['assignmentRepository'].find({
        where: {
          applicationId: financialInfo.application.id,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: financialInfo.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        financialInfo.application.id,
        '5-financial-information',
        financialInfo.id,
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
    documentFiles?: any, // Can be single file, array of files, or array of document IDs
  ) {
    const savedResult = await this.dataSource.transaction(async (manager) => {
      const taxReturnRepo = manager.getRepository(TaxReturnEntity);
      const documentRepo = manager.getRepository(WarehouseDocument);
      const appRepo = manager.getRepository(WarehouseOperatorApplicationRequest);
      const historyRepo = manager.getRepository(TaxReturnHistoryEntity);

      // Normalize documentFiles to array
      let filesToUpload: any[] = [];
      let documentIdsToKeep: string[] = [];
      
      if (documentFiles) {
        if (Array.isArray(documentFiles)) {
          // Check if array contains files or document IDs
          documentFiles.forEach((item) => {
            if (item && typeof item === 'object' && item.buffer) {
              // It's a file
              filesToUpload.push(item);
            } else if (typeof item === 'string') {
              // It's a document ID
              documentIdsToKeep.push(item);
            }
          });
        } else if (documentFiles.buffer) {
          // Single file
          filesToUpload = [documentFiles];
        } else if (typeof documentFiles === 'string') {
          // Single document ID
          documentIdsToKeep = [documentFiles];
        }
      }

      // Also check dto.documents for document IDs (from frontend)
      if (dto.documents && Array.isArray(dto.documents)) {
        dto.documents.forEach((docId: string) => {
          if (typeof docId === 'string' && !documentIdsToKeep.includes(docId)) {
            documentIdsToKeep.push(docId);
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
          where: { id: financialInfo.application.id },
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
      where: { id: financialInfo.application.id },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.warehouseService['assignmentRepository'].find({
        where: {
          applicationId: financialInfo.application.id,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: financialInfo.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        financialInfo.application.id,
        '5-financial-information',
        financialInfo.id,
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
    documentFile?: any,
  ) {
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
          where: { id: financialInfo.application.id },
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

        // Handle document upload/update
        // If file is provided, overwrite the old document
        // If string (documentId) is provided in dto.document, ignore it (keep existing document)
        if (documentFile) {
          // Upload new document (replace existing if any)
          const doc = await this.warehouseService.uploadWarehouseDocument(
            documentFile,
            userId,
            'BankStatement',
            existing.id,
            'document',
          );
          const documentEntity = await documentRepo.findOne({ where: { id: doc.id } });
          if (documentEntity) {
            existing.document = documentEntity;
          }
        }
        // If documentId (string) is provided in dto.document, ignore it - keep existing document relationship

        await bankStatementRepo.save(existing);
        return existing;
      } else {
        // Create new - document is required
        if (!documentFile) {
          throw new BadRequestException('Document is required for bank statement. Please upload a document.');
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
        const doc = await this.warehouseService.uploadWarehouseDocument(
          documentFile,
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
      where: { id: financialInfo.application.id },
    });

    // if application is rejected, track resubmission and update status if all sections are complete
    if (updatedApplication?.status === WarehouseOperatorApplicationStatus.REJECTED) {
      // Track resubmission and update status if all sections are complete
      // Find the assignment section for financial information if it exists
      const assignments = await this.warehouseService['assignmentRepository'].find({
        where: {
          applicationId: financialInfo.application.id,
          level: AssignmentLevel.HOD_TO_APPLICANT,
          status: AssignmentStatus.REJECTED,
        },
      });

      let assignmentSectionId: string | null = null;
      if (assignments.length > 0) {
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: financialInfo.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      await this.warehouseService['trackResubmissionAndUpdateStatus'](
        financialInfo.application.id,
        '5-financial-information',
        financialInfo.id,
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
    documentFile?: any,
  ) {
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

        // Handle document upload/update
        // If file is provided, overwrite the old document
        // If string (documentId) is provided, ignore it (keep existing document)
        if (documentFile) {
          // Upload new document (replace existing if any)
          const doc = await this.warehouseService.uploadWarehouseDocument(
            documentFile,
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
        }
        // If documentId (string) is provided, ignore it - keep existing document relationship

        await othersRepo.save(existing);

        return existing;
      } else {
        // Create new - document file is required
        if (!documentFile) {
          throw new BadRequestException('Document is required for other document. Please upload a document.');
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
        const doc = await this.warehouseService.uploadWarehouseDocument(
          documentFile,
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
      if (assignments.length > 0 && currentFinancialInfo) {
        const assignmentSections = await this.warehouseService['assignmentSectionRepository'].find({
          where: {
            assignmentId: In(assignments.map((a) => a.id)),
            sectionType: '5-financial-information',
            resourceId: currentFinancialInfo.id,
          },
        });

        if (assignmentSections.length > 0) {
          assignmentSectionId = assignmentSections[0].id;
        }
      }

      // Call helper function to track resubmission and update status
      if (currentFinancialInfo) {
        await this.warehouseService['trackResubmissionAndUpdateStatus'](
          applicationId,
          '5-financial-information',
          currentFinancialInfo.id,
          assignmentSectionId ?? undefined,
        );
      }
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

