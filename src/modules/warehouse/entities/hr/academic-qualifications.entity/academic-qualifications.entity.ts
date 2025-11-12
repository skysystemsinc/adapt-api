import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HrEntity } from "../../hr.entity";
import { WarehouseDocument } from "../../warehouse-document.entity";

@Entity('hr_academic_qualifications')
export class AcademicQualificationsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    degree: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    major: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    institute: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    country: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    yearOfPassing: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    grade: string;

    @Column({ nullable: true })
    academicCertificateDocumentId?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'academicCertificateDocumentId' })
    academicCertificateDocument?: WarehouseDocument;

    @Column({ nullable: true })
    hrId: string;

    @ManyToOne(() => HrEntity, (hr) => hr.academicQualifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hrId' })
    hr: HrEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
