import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicantChecklistEntity } from "../applicant-checklist.entity";
import { WarehouseDocument } from "../warehouse-document.entity";

@Entity('human_resources_checklist')
export class HumanResourcesChecklistEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    qcPersonnel: boolean;

    @Column({ nullable: true })
    qcPersonnelFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'qcPersonnelFile' })
    qcPersonnelDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    warehouseSupervisor: boolean;

    @Column({ nullable: true })
    warehouseSupervisorFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'warehouseSupervisorFile' })
    warehouseSupervisorDocument?: WarehouseDocument;

    @Column({ type: 'boolean', default: false })
    dataEntryOperator: boolean;

    @Column({ nullable: true })
    dataEntryOperatorFile?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'dataEntryOperatorFile' })
    dataEntryOperatorDocument?: WarehouseDocument;

    @ManyToOne(() => ApplicantChecklistEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicantChecklistId' })
    applicantChecklist: ApplicantChecklistEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

