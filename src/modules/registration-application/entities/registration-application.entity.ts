import { ApplicationType } from "../../application-type/entities/application-type.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RegistrationApplicationDetails } from "./registration-application-details.entity";

export enum ApplicationStatus {
    PENDING = 'PENDING',
    IN_PROCESS = 'IN_PROCESS',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

@Entity('registration_application')
export class RegistrationApplication {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => ApplicationType)
    @JoinColumn({ name: 'applicationTypeId' })
    applicationTypeId: ApplicationType;

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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

