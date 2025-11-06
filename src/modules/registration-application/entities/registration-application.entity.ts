import { ApplicationType } from "../../application-type/entities/application-type.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RegistrationApplicationDetails } from "./registration-application-details.entity";

export enum ApplicationStatus {
    PENDING = 'PENDING',
    IN_PROCESS = 'IN_PROCESS',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SENT_TO_HOD = 'SENT_TO_HOD'
}

@Entity('registration_application')
export class RegistrationApplication {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    applicationId: string;

    @OneToOne(() => ApplicationType, { nullable: true })
    @JoinColumn({ name: 'applicationTypeId' })
    applicationTypeId: ApplicationType | null;

    @OneToMany(() => RegistrationApplicationDetails, details => details.application, { cascade: true })
    details: RegistrationApplicationDetails[];

    @Column({ 
        type: 'enum',
        enum: ApplicationStatus,
        default: ApplicationStatus.PENDING,
    })
    status: ApplicationStatus;

    // Metadata fields
    @Column({ nullable: true })
    ipAddress: string;

    @Column({ type: 'text', nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    referrer: string;

    @Column({ nullable: true })
    formId: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any; // Changed from text to jsonb for better querying

    @Column({ type: 'text', nullable: true })
    remarks: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

