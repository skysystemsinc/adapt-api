import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RegistrationApplication } from "./registration-application.entity";

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

    @Column({ 
        type: 'enum',
        enum: DetailStatus,
        default: DetailStatus.PENDING,
    })
    status: DetailStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

