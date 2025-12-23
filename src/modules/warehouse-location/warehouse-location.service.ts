import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { CreateWarehouseLocationDto } from './dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse-location.dto';
import { WarehouseLocation, WarehouseLocationStatus } from './entities/warehouse-location.entity';
import { ResubmittedSectionEntity } from '../warehouse/entities/resubmitted-section.entity';
import { Assignment, AssignmentLevel, AssignmentStatus } from '../warehouse/operator/assignment/entities/assignment.entity';
import { AssignmentSection } from '../warehouse/operator/assignment/entities/assignment-section.entity';
import { AssignmentHistory } from '../warehouse/operator/assignment/entities/assignment-history.entity';
import { AssignmentSectionHistory } from '../warehouse/operator/assignment/entities/assignment-section-history.entity';
import { AssignmentSectionFieldHistory } from '../warehouse/operator/assignment/entities/assignment-section-field-history.entity';
import { ApplicationRejectionEntity } from '../warehouse/entities/application-rejection.entity';
import { ApplicationRejectionHistoryEntity } from '../warehouse/entities/application-rejection-history.entity';

@Injectable()
export class WarehouseLocationService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly warehouseLocationRepository: Repository<WarehouseLocation>,
    private readonly dataSource: DataSource,
  ) { }

  async create(createWarehouseLocationDto: CreateWarehouseLocationDto, userId: string) {

    const existingDraft = await this.warehouseLocationRepository.findOne({
      where: { userId, status: WarehouseLocationStatus.DRAFT },
    });

    if (existingDraft) {
      throw new BadRequestException(
        'You already have a draft application. Please update your existing application instead of creating a new one.'
      );
    }

    const activeApplications = await this.warehouseLocationRepository.find({
      where: { userId },
    });

    const hasActiveApplication = activeApplications.some(
      (app) =>
        app.status === WarehouseLocationStatus.DRAFT ||
        app.status === WarehouseLocationStatus.PENDING ||
        app.status === WarehouseLocationStatus.IN_PROCESS
    );

    if (hasActiveApplication) {
      throw new BadRequestException(
        'You have an active application that is not yet submitted. Please submit or complete your existing application before creating a new one.'
      );
    }

    const applicationId = await this.generateApplicationId();

    const newApplication = this.warehouseLocationRepository.create({
      userId,
      applicationId,
      status: WarehouseLocationStatus.DRAFT,
    });

    const savedApplication = await this.warehouseLocationRepository.save(newApplication);

    return {
      message: 'Warehouse location application created successfully',
      applicationId: savedApplication.id,
      status: savedApplication.status,
    };
  }

  findAll() {
    return `This action returns all warehouseLocation`;
  }

  async findAllByUserId(userId: string): Promise<{ applicationId: string; status: string }[]> {
    const applications = await this.warehouseLocationRepository.find({
      where: { userId },
      select: ['id', 'applicationId', 'status', 'metadata'],
      order: { createdAt: 'DESC' },
    });

    return applications.map((app) => ({
      id: app.id,
      applicationId: app.applicationId,
      status: app.status,
      metadata: app.metadata,
    }));
  }

  findOne(id: number) {
    return `This action returns a #${id} warehouseLocation`;
  }

  update(id: number, updateWarehouseLocationDto: UpdateWarehouseLocationDto) {
    return `This action updates a #${id} warehouseLocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} warehouseLocation`;
  }

  async generateApplicationId(): Promise<string> {
    const count = await this.warehouseLocationRepository.count();
    const applicationId = `WHL-${String(count + 1).padStart(6, '0')}`;
    return applicationId;
  }

  /**
   * Track facility resubmission and update status
   * This function is called from update endpoints during resubmission to:
   * 1. Record which sections have been resubmitted
   * 2. Check if all rejected sections have been addressed
   * 3. Update application status to PENDING if all sections are complete
   * 
   * @param warehouseLocationId - The warehouse location application ID
   * @param sectionType - The section type being resubmitted (e.g., '1-facility', '2-contact', etc.)
   * @param resourceId - Optional resource ID for sections with multiple entries (e.g., HR entries)
   * @param assignmentSectionId - Optional assignment section ID
   * @param manager - Optional entity manager for transaction support
   */
  async trackWarehouseLocationResubmissionAndUpdateStatus(
    warehouseLocationId: string,
    sectionType: string,
    resourceId?: string | null,
    assignmentSectionId?: string | null,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager || this.dataSource.manager;
    const resubmittedSectionRepo = repo.getRepository(ResubmittedSectionEntity);
    const warehouseLocationRepo = repo.getRepository(WarehouseLocation);
    const assignmentRepo = repo.getRepository(Assignment);
    const assignmentSectionRepo = repo.getRepository(AssignmentSection);

    // Get warehouse location application with rejections
    const application = await warehouseLocationRepo.findOne({
      where: { id: warehouseLocationId },
      relations: ['rejections'],
    });

    if (!application) {
      return; // Application not found, skip tracking
    }

    // Only track if application is in REJECTED status
    if (application.status !== WarehouseLocationStatus.REJECTED) {
      return;
    }

    // Map normalized section types to display names used in unlockedSections
    const sectionTypeMap: Record<string, string[]> = {
      '1-facility': ['1-facility'],
      '2-contact': ['2-contact'],
      '3-jurisdiction': ['3-jurisdiction'],
      '4-security-fire-safety': ['4-security-fire-safety'],
      '5-weighing': ['5-weighing'],
      '6-technical-qualitative': ['6-technical-qualitative'],
      '7-human-resources': ['7-human-resources'],
      '8-checklist': ['8-checklist'],
    };

    // Find the display name for this section type
    const displaySectionNames: string[] = [];
    for (const [normalized, displayNames] of Object.entries(sectionTypeMap)) {
      if (normalized === sectionType || sectionType.includes(normalized) || normalized.includes(sectionType)) {
        displaySectionNames.push(...displayNames);
        break;
      }
    }

    // If no mapping found, use the sectionType as-is
    if (displaySectionNames.length === 0) {
      displaySectionNames.push(sectionType);
    }

    // Check if any rejection has this section unlocked
    const hasUnlockedSection = application.rejections.some((rejection) =>
      rejection.unlockedSections?.some((unlocked) =>
        displaySectionNames.some((displayName) => unlocked.includes(displayName) || displayName.includes(unlocked))
      )
    );

    if (!hasUnlockedSection) {
      return; // This section is not unlocked, no need to track
    }

    // Record the resubmission
    const whereClause: any = {
      warehouseLocationId,
      sectionType,
    };
    if (resourceId !== undefined && resourceId !== null) {
      whereClause.resourceId = resourceId;
    } else {
      whereClause.resourceId = null;
    }
    if (assignmentSectionId !== undefined && assignmentSectionId !== null) {
      whereClause.assignmentSectionId = assignmentSectionId;
    } else {
      whereClause.assignmentSectionId = null;
    }

    const existingResubmission = await resubmittedSectionRepo.findOne({
      where: whereClause,
    });

    if (!existingResubmission) {
      const resubmittedSection = resubmittedSectionRepo.create({
        warehouseLocationId,
        sectionType,
        resourceId: resourceId ?? undefined,
        assignmentSectionId: assignmentSectionId ?? undefined,
      });
      await resubmittedSectionRepo.save(resubmittedSection);
    }

    // Get all assignments for this application with HOD_TO_APPLICANT level and REJECTED status
    const assignments = await assignmentRepo.find({
      where: {
        applicationLocationId: warehouseLocationId,
        level: AssignmentLevel.HOD_TO_APPLICANT,
        status: AssignmentStatus.REJECTED,
      },
    });

    if (assignments.length === 0) {
      return; // No assignments found, cannot verify completion
    }

    // Get all assignment sections for these assignments
    const assignmentSections = await assignmentSectionRepo.find({
      where: {
        assignmentId: In(assignments.map((a) => a.id)),
      },
    });

    // Get all unique unlocked sections from rejections
    const allUnlockedSections = application.rejections
      .flatMap((rejection) => rejection.unlockedSections || [])
      .filter((section, index, self) => self.indexOf(section) === index); // unique

    if (allUnlockedSections.length === 0) {
      return;
    }

    // Check if all unlocked sections have been resubmitted
    const sectionCompletionChecks = await Promise.all(
      allUnlockedSections.map(async (unlockedSection) => {
        // Find the normalized section type for this unlocked section
        let normalizedType: string | null = null;
        for (const [normalized, displayNames] of Object.entries(sectionTypeMap)) {
          if (displayNames.some((displayName) => unlockedSection.includes(displayName) || displayName.includes(unlockedSection))) {
            normalizedType = normalized;
            break;
          }
        }

        // If no mapping found, try to match directly
        if (!normalizedType) {
          normalizedType = unlockedSection.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        }

        // Get all assignment sections for this section type
        const sectionsForType = assignmentSections.filter((section) => {
          // Match normalized type or check if sectionType contains the normalized type
          return section.sectionType === normalizedType ||
            section.sectionType.includes(normalizedType!) ||
            normalizedType!.includes(section.sectionType);
        });

        if (sectionsForType.length === 0) {
          // No specific resources to check, verify if any resubmission exists for this section type
          const resubmissions = await resubmittedSectionRepo.find({
            where: {
              warehouseLocationId,
              sectionType: normalizedType!,
            },
          });
          return resubmissions.length > 0;
        }

        // For sections with multiple resources, check if all resourceIds have been resubmitted
        const resourceIds = sectionsForType
          .map((section) => section.resourceId)
          .filter((id): id is string => id !== null && id !== undefined);

        if (resourceIds.length === 0) {
          // No resourceIds, check if any resubmission exists for this section type
          const resubmissions = await resubmittedSectionRepo.find({
            where: {
              warehouseLocationId,
              sectionType: normalizedType!,
            },
          });
          return resubmissions.length > 0;
        }

        // Check if all resourceIds have been resubmitted
        const resubmittedResourceIds = await resubmittedSectionRepo.find({
          where: {
            warehouseLocationId,
            sectionType: normalizedType!,
            resourceId: In(resourceIds),
          },
        });

        const resubmittedIds = new Set(resubmittedResourceIds.map((r) => r.resourceId).filter((id): id is string => id !== null && id !== undefined));

        // All resourceIds must be resubmitted
        return resourceIds.every((resourceId) => resubmittedIds.has(resourceId));
      })
    );

    const allSectionsComplete = sectionCompletionChecks.every((isComplete) => isComplete);

    // If all sections are complete, update application status to PENDING
    if (allSectionsComplete) {
      application.status = WarehouseLocationStatus.PENDING;

      // Move all completed assignment sections to history (only assignments related to rejected sections)
      // This also returns the list of resubmitted section types and resourceIds
      const { resubmittedSections, resubmittedResourcesBySection } = await this.moveAllCompletedAssignmentSectionsToHistory(warehouseLocationId, application.rejections, repo);

      // Mark as resubmitted in metadata with the list of resubmitted sections and resourceIds
      application.metadata = {
        ...(application.metadata || {}),
        isResubmitted: true,
        resubmittedAt: new Date().toISOString(),
        resubmittedSections: resubmittedSections,
        resubmittedResourcesBySection: resubmittedResourcesBySection,
      };
      await warehouseLocationRepo.save(application);

      // Move all application rejections to history (all rejections from current cycle)
      await this.moveApplicationRejectionsToHistory(warehouseLocationId, repo);
    }
  }

  /**
   * Moves all completed assignment sections to history when all sections are resubmitted.
   * This allows users to resubmit sections multiple times until all sections are complete.
   * Only moves assignments that are related to rejected sections.
   * 
   * @param warehouseLocationId - The warehouse location application ID
   * @param rejections - Array of application rejections to determine which sections were rejected
   * @param manager - EntityManager for database operations
   * @returns Object containing array of display names for resubmitted sections and resourceIds by section
   */
  private async moveAllCompletedAssignmentSectionsToHistory(
    warehouseLocationId: string,
    rejections: ApplicationRejectionEntity[],
    manager: EntityManager,
  ): Promise<{ resubmittedSections: string[]; resubmittedResourcesBySection: Record<string, string[]> }> {
    const assignmentRepo = manager.getRepository(Assignment);
    const assignmentSectionRepo = manager.getRepository(AssignmentSection);
    const assignmentSectionHistoryRepo = manager.getRepository(AssignmentSectionHistory);
    const assignmentSectionFieldHistoryRepo = manager.getRepository(AssignmentSectionFieldHistory);
    const assignmentHistoryRepo = manager.getRepository(AssignmentHistory);

    // Get all rejected section types from all rejections
    const rejectedSectionTypes = rejections
      .flatMap((rejection) => rejection.unlockedSections || [])
      .filter((section, index, self) => self.indexOf(section) === index); // unique

    if (rejectedSectionTypes.length === 0) {
      return {
        resubmittedSections: [],
        resubmittedResourcesBySection: {},
      }; // No rejected sections, nothing to move
    }

    // Map normalized section types to display names used in unlockedSections (for facility/location)
    const sectionTypeMap: Record<string, string[]> = {
      '1-facility': ['1-facility'],
      '2-contact': ['2-contact'],
      '3-jurisdiction': ['3-jurisdiction'],
      '4-security-fire-safety': ['4-security-fire-safety'],
      '5-weighing': ['5-weighing'],
      '6-technical-qualitative': ['6-technical-qualitative'],
      '7-human-resources': ['7-human-resources'],
      '8-checklist': ['8-checklist'],
    };

    // Section type to human-readable display name mapping
    const sectionDisplayNames: Record<string, string> = {
      '1-facility': 'Facility Information',
      '2-contact': 'Contact Information',
      '3-jurisdiction': 'Jurisdiction Information',
      '4-security-fire-safety': 'Security and Fire Safety',
      '5-weighing': 'Weighing Facilities',
      '6-technical-qualitative': 'Technical Qualitative',
      '7-human-resources': 'HR Information',
      '8-checklist': 'Application Checklist',
    };

    // Normalize rejected section types to match assignment section types
    const normalizedRejectedTypes = new Set<string>();
    for (const rejectedSection of rejectedSectionTypes) {
      // Try to find normalized type from map
      let normalizedType: string | null = null;
      for (const [normalized, displayNames] of Object.entries(sectionTypeMap)) {
        if (displayNames.some((displayName) => rejectedSection.includes(displayName) || displayName.includes(rejectedSection))) {
          normalizedType = normalized;
          break;
        }
      }

      // If no mapping found, try to normalize directly
      if (!normalizedType) {
        normalizedType = rejectedSection.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      }

      if (normalizedType) {
        normalizedRejectedTypes.add(normalizedType);
      }
    }

    // Find all assignments for this application with HOD_TO_APPLICANT or OFFICER_TO_HOD level
    const assignments = await assignmentRepo.find({
      where: {
        applicationLocationId: warehouseLocationId,
        level: In([AssignmentLevel.HOD_TO_APPLICANT, AssignmentLevel.OFFICER_TO_HOD]),
      },
      relations: ['sections', 'sections.fields', 'parentAssignment'],
    });

    // Filter assignments to only include those that have sections matching rejected section types
    const assignmentsToMove = assignments.filter((assignment) => {
      if (!assignment.sections || assignment.sections.length === 0) {
        return false;
      }

      // Check if any section in this assignment matches a rejected section type
      return assignment.sections.some((section) => {
        // Check if sectionType matches any rejected type
        return normalizedRejectedTypes.has(section.sectionType) ||
          Array.from(normalizedRejectedTypes).some((rejectedType) =>
            section.sectionType.includes(rejectedType) || rejectedType.includes(section.sectionType)
          );
      });
    });

    // Collect unique section types and resourceIds from all assignments being moved
    const resubmittedSectionTypes = new Set<string>();
    const resubmittedResourcesBySection: Record<string, string[]> = {};

    for (const assignment of assignmentsToMove) {
      if (assignment.sections && assignment.sections.length > 0) {
        for (const section of assignment.sections) {
          // Check if this section matches a rejected type
          const matchesRejected = normalizedRejectedTypes.has(section.sectionType) ||
            Array.from(normalizedRejectedTypes).some((rejectedType) =>
              section.sectionType.includes(rejectedType) || rejectedType.includes(section.sectionType)
            );

          if (matchesRejected) {
            resubmittedSectionTypes.add(section.sectionType);

            // Store resourceId for granular tracking (especially for HR)
            if (section.resourceId) {
              if (!resubmittedResourcesBySection[section.sectionType]) {
                resubmittedResourcesBySection[section.sectionType] = [];
              }
              if (!resubmittedResourcesBySection[section.sectionType].includes(section.resourceId)) {
                resubmittedResourcesBySection[section.sectionType].push(section.resourceId);
              }
            }
          }
        }
      }
    }

    // Map section types to display names
    const resubmittedSections = Array.from(resubmittedSectionTypes)
      .map((sectionType) => sectionDisplayNames[sectionType] || sectionType)
      .filter((name, index, self) => self.indexOf(name) === index); // unique

    for (const assignment of assignmentsToMove) {
      // Move all sections for this assignment to history
      if (assignment.sections && assignment.sections.length > 0) {
        for (const section of assignment.sections) {
          // Move assignment section fields to history
          if (section.fields && section.fields.length > 0) {
            for (const field of section.fields) {
              const fieldHistory = assignmentSectionFieldHistoryRepo.create({
                assignmentSectionFieldId: field.id,
                assignmentSectionId: section.id,
                fieldName: field.fieldName,
                remarks: field.remarks,
                status: field.status,
                isActive: false,
              });
              // Preserve original createdAt
              fieldHistory.createdAt = field.createdAt;
              await assignmentSectionFieldHistoryRepo.save(fieldHistory);
            }
          }

          // Move assignment section to history
          const sectionHistory = assignmentSectionHistoryRepo.create({
            assignmentSectionId: section.id,
            assignmentId: assignment.id,
            sectionType: section.sectionType,
            resourceId: section.resourceId,
            resourceType: section.resourceType,
            isActive: false,
          });
          // Preserve original createdAt
          sectionHistory.createdAt = section.createdAt;
          await assignmentSectionHistoryRepo.save(sectionHistory);
        }

        // Delete all sections (cascade will delete fields)
        await assignmentSectionRepo.remove(assignment.sections);
      }

      // Move assignment to history
      const assignmentHistory = assignmentHistoryRepo.create({
        assignmentId: assignment.id,
        parentAssignmentId: assignment.parentAssignment?.id || null,
        applicationId: assignment.applicationId,
        applicationLocationId: assignment.applicationLocationId,
        assignedBy: assignment.assignedBy,
        assignedTo: assignment.assignedTo,
        level: assignment.level,
        assessmentId: assignment.assessmentId,
        status: assignment.status,
        isActive: false,
      });
      // Preserve original createdAt
      assignmentHistory.createdAt = assignment.createdAt;
      await assignmentHistoryRepo.save(assignmentHistory);

      // Delete the assignment
      await assignmentRepo.remove(assignment);
    }

    return {
      resubmittedSections,
      resubmittedResourcesBySection,
    };
  }

  /**
   * Moves all application rejections to history after successful resubmission.
   * This clears the active rejections table once all rejected sections have been addressed.
   * 
   * @param warehouseLocationId - The warehouse location application ID
   * @param manager - EntityManager for database operations
   */
  private async moveApplicationRejectionsToHistory(
    warehouseLocationId: string,
    manager: EntityManager,
  ): Promise<void> {
    const rejectionRepo = manager.getRepository(ApplicationRejectionEntity);
    const rejectionHistoryRepo = manager.getRepository(ApplicationRejectionHistoryEntity);

    // Find all rejections for this application (all rejections from current cycle)
    const rejections = await rejectionRepo.find({
      where: { locationApplicationId: warehouseLocationId },
    });

    if (rejections.length === 0) {
      return; // No rejections to move
    }

    // Move each rejection to history
    for (const rejection of rejections) {
      const rejectionHistory = rejectionHistoryRepo.create({
        applicationId: rejection.applicationId,
        locationApplicationId: rejection.locationApplicationId,
        rejectionReason: rejection.rejectionReason,
        rejectionBy: rejection.rejectionBy,
        unlockedSections: rejection.unlockedSections,
      });

      // Preserve original createdAt timestamp
      rejectionHistory.createdAt = rejection.createdAt;

      await rejectionHistoryRepo.save(rejectionHistory);
    }

    // Delete all rejections from active table
    await rejectionRepo.remove(rejections);
  }
}
