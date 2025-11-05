import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RegistrationApplication } from "./registration-application.entity";
import { DocumentType } from "../../document-type/entities/document-type.entity";

export enum DetailStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

@Entity('registration_application_details')
export class RegistrationApplicationDetails {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RegistrationApplication, application => application.details)
    @JoinColumn({ name: 'applicationId' })
    application: RegistrationApplication;

    @Column()
    key: string;

    @Column({ type: 'text' })
    value: string;

  @Column({ type: 'text', nullable: true })
  label: string | null;

  @Column({
    type: 'enum',
    enum: DetailStatus,
    default: DetailStatus.PENDING,
  })
  status: DetailStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'uuid', nullable: true })
  documentTypeId: string | null;

  @ManyToOne(() => DocumentType, { nullable: true })
  @JoinColumn({ name: 'documentTypeId' })
  documentType: DocumentType | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

