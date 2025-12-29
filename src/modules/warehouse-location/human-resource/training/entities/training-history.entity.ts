import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "../../entities/human-resource.entity";
import { WarehouseDocument } from "../../../../warehouse/entities/warehouse-document.entity";
import { Training } from "./training.entity";

@Entity('trainings_history')
export class TrainingHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    trainingId: string;

    @ManyToOne(() => Training, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'trainingId' })
    training: Training;

    @Column({ type: 'uuid' })
    humanResourceId: string;

    @Column({ type: 'varchar', length: 200 })
    trainingTitle: string;

    @Column({ type: 'varchar', length: 200 })
    conductedBy: string;

    @Column({ type: 'varchar', length: 100 })
    trainingType: string;

    @Column({ type: 'varchar', length: 50 })
    duration: string;

    @Column({ type: 'date', nullable: true })
    dateOfCompletion: Date;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'trainingCertificate' })
    trainingCertificate: WarehouseDocument;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => HumanResource, (hr) => hr.trainings)
    @JoinColumn({ name: 'humanResourceId' })
    humanResource: HumanResource;
}
