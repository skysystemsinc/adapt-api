import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseLocation } from "../../entities/warehouse-location.entity";
import { AcademicQualification } from "../academic-qualification/entities/academic-qualification.entity";
import { ProfessionalQualification } from "../professional-qualification/entities/professional-qualification.entity";
import { Training } from "../training/entities/training.entity";
import { ProfessionalExperience } from "../professional-experience/entities/professional-experience.entity";
import { WarehouseDocument } from "../../../warehouse/entities/warehouse-document.entity";

@Entity('human_resources')
export class HumanResource {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    warehouseLocationId: string;

    @Column({ type: 'varchar', length: 200 })
    fullName: string;

    @Column({ type: 'varchar', length: 200 })
    fathersHusbandsName: string;

    @Column({ type: 'varchar', length: 50 })
    cnicPassport: string;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable:true })
    @JoinColumn({ name: 'photograph' })
    photograph: WarehouseDocument;

    @Column({ type: 'varchar', length: 100 })
    nationality: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({ type: 'text' })
    residentialAddress: string;

    @Column({ type: 'text' })
    businessAddress: string;

    @Column({ type: 'varchar', length: 50 })
    telephoneNumber: string;

    @Column({ type: 'varchar', length: 50 })
    mobileNumber: string;

    @Column({ type: 'varchar', length: 200 })
    email: string;

    @Column({ type: 'varchar', length: 100 })
    hrNationalTaxNumber: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => WarehouseLocation, (warehouse) => warehouse.humanResources)
    @JoinColumn({ name: 'warehouseLocationId' })
    warehouseLocation: WarehouseLocation;

    @OneToMany(() => AcademicQualification, (qual) => qual.humanResource)
    academicQualifications: AcademicQualification[];

    @OneToMany(() => ProfessionalQualification, (qual) => qual.humanResource)
    professionalQualifications: ProfessionalQualification[];

    @OneToMany(() => Training, (training) => training.humanResource)
    trainings: Training[];

    @OneToMany(() => ProfessionalExperience, (exp) => exp.humanResource)
    professionalExperiences: ProfessionalExperience[];
}
