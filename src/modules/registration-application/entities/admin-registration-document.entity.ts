import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RegistrationApplication } from './registration-application.entity';
import { RegistrationApplicationDetails } from './registration-application-details.entity';

@Entity('admin_registration_documents')
export class AdminRegistrationDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    applicationId: string;

    @ManyToOne(() => RegistrationApplication, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: RegistrationApplication;

    @Column({ type: 'uuid' })
    detailId: string;

    @ManyToOne(() => RegistrationApplicationDetails, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'detailId' })
    detail: RegistrationApplicationDetails;

    @Column({ type: 'text' })
    document: string; // File path

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

