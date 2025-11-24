import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "../../entities/human-resource.entity";

@Entity('trainings')
export class Training {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

    @Column({ type: 'varchar', length: 500, nullable: true })
    trainingCertificate: string;

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
