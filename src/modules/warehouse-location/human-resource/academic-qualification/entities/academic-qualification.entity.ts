import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "../../entities/human-resource.entity";

@Entity('academic_qualifications')
export class AcademicQualification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    humanResourceId: string;

    @Column({ type: 'varchar', length: 200 })
    degree: string;

    @Column({ type: 'varchar', length: 200 })
    major: string;

    @Column({ type: 'varchar', length: 300 })
    institute: string;

    @Column({ type: 'varchar', length: 100 })
    country: string;

    @Column({ type: 'varchar', length: 50 })
    yearOfPassing: string;

    @Column({ type: 'varchar', length: 50 })
    grade: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    academicCertificate: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => HumanResource, (hr) => hr.academicQualifications)
    @JoinColumn({ name: 'humanResourceId' })
    humanResource: HumanResource;
}
