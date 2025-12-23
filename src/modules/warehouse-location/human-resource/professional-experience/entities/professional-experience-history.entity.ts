import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "../../entities/human-resource.entity";
import { WarehouseDocument } from "../../../../warehouse/entities/warehouse-document.entity";
import { ProfessionalExperience } from "./professional-experience.entity";

@Entity('professional_experiences_history')
export class ProfessionalExperienceHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    professionalExperienceId: string;

    @ManyToOne(() => ProfessionalExperience, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'professionalExperienceId' })
    professionalExperience: ProfessionalExperience;

    @Column({ type: 'uuid' })
    humanResourceId: string;

    @Column({ type: 'varchar', length: 200 })
    positionHeld: string;

    @Column({ type: 'varchar', length: 300 })
    organizationName: string;

    @Column({ type: 'text' })
    organizationAddress: string;

    @Column({ type: 'varchar', length: 200 })
    natureOfOrganization: string;

    @Column({ type: 'date', nullable: true })
    dateOfAppointment: Date;

    @Column({ type: 'date', nullable: true })
    dateOfLeaving: Date;

    @Column({ type: 'varchar', length: 50 })
    duration: string;

    @Column({ type: 'text', nullable: true })
    responsibilities: string | null;
    
    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'experienceLetter' })
    experienceLetter: WarehouseDocument;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => HumanResource, (hr) => hr.professionalExperiences)
    @JoinColumn({ name: 'humanResourceId' })
    humanResource: HumanResource;
}
