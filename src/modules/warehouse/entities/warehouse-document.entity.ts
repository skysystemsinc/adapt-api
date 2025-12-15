import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * WarehouseDocument - Polymorphic document entity for warehouse-related documents
 * 
 * This entity supports polymorphic relationships, allowing documents to be associated
 * with different warehouse entities (CompanyInformation, BankDetails, etc.)
 * 
 * Example usage:
 * - ntcCertificate for CompanyInformation
 * - bankStatement for BankDetails
 * - auditReport for FinancialInformation
 */
@Entity('warehouse_documents')
@Index(['documentableType', 'documentableId'])
@Index(['userId'])
export class WarehouseDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User who uploaded/owns the document
   */
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Polymorphic relationship: Type of the entity this document belongs to
   * Examples: 'CompanyInformation', 'BankDetails', 'FinancialInformation', etc.
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  documentableType: string;

  /**
   * Polymorphic relationship: ID of the entity this document belongs to
   */
  @Column({ type: 'uuid', nullable: false })
  documentableId: string;

  /**
   * Document type identifier (e.g., 'ntcCertificate', 'bankStatement', 'auditReport')
   * This helps identify what kind of document it is within the context of the parent entity
   */
  @Column({ type: 'varchar', length: 100, nullable: false })
  documentType: string;

  /**
   * Original filename as uploaded by user
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  originalFileName: string;

  /**
   * File path where the document is stored
   */
  @Column({ type: 'text', nullable: false })
  filePath: string;

  /**
   * MIME type of the file
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType: string;

  /**
   * Initialization vector for encrypted files (hex string)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  iv: string;

  /**
   * Authentication tag for encrypted files (hex string)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  authTag: string;

//   /**
//    * File size in bytes
//    */
//   @Column({ type: 'bigint', nullable: true })
//   fileSize: number;

//   /**
//    * Optional description or notes about the document
//    */
//   @Column({ type: 'text', nullable: true })
//   description: string;

  /**
   * Whether the document is active/visible
   */
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

