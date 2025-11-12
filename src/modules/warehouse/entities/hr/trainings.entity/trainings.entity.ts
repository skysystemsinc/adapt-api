import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HrEntity } from "../../hr.entity";
import { WarehouseDocument } from "../../warehouse-document.entity";

@Entity("hr_trainings")
export class TrainingsEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 150 })
    trainingTitle: string;

    @Column({ type: "varchar", length: 150 })
    conductedBy: string;

    @Column({ type: "varchar", length: 100 })
    trainingType: string;

    @Column({ type: "varchar", length: 20 })
    durationStart: string;

    @Column({ type: "varchar", length: 20 })
    durationEnd: string;

    @Column({ type: "varchar", length: 20 })
    dateOfCompletion: string;

    @Column({ nullable: true })
    trainingCertificateDocumentId?: string;

    @ManyToOne(() => WarehouseDocument, { onDelete: "SET NULL" })
    @JoinColumn({ name: "trainingCertificateDocumentId" })
    trainingCertificateDocument?: WarehouseDocument;

    @Column({ nullable: true })
    hrId: string;

    @ManyToOne(() => HrEntity, (hr) => hr.trainings, { onDelete: "CASCADE" })
    @JoinColumn({ name: "hrId" })
    hr: HrEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

