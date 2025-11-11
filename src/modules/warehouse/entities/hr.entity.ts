import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseOperatorApplicationRequest } from "./warehouse-operator-application-request.entity";
import { PersonalDetailsEntity } from "./hr/personal-details.entity/personal-details.entity";
import { AcademicQualificationsEntity } from "./hr/academic-qualifications.entity/academic-qualifications.entity";
import { ProfessionalQualificationsEntity } from "./hr/professional-qualifications.entity/professional-qualifications.entity";
import { TrainingsEntity } from "./hr/trainings.entity/trainings.entity";
import { ExperienceEntity } from "./hr/experience.entity/experience.entity";
import { DeclarationEntity } from "./hr/declaration.entity/declaration.entity";

@Entity('hrs')
export class HrEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    applicationId: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: WarehouseOperatorApplicationRequest;

    @Column({ nullable: true })
    personalDetailsId: string;

    @OneToOne(() => PersonalDetailsEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'personalDetailsId' })
    personalDetails: PersonalDetailsEntity;

    @OneToMany(() => AcademicQualificationsEntity, (academicQualification) => academicQualification.hr, {
        cascade: true,
    })
    academicQualifications: AcademicQualificationsEntity[];

    @OneToMany(() => ProfessionalQualificationsEntity, (professionalQualification) => professionalQualification.hr, {
        cascade: true,
    })
    professionalQualifications: ProfessionalQualificationsEntity[];

    @OneToMany(() => TrainingsEntity, (training) => training.hr, {
        cascade: true,
    })
    trainings: TrainingsEntity[];

    @OneToMany(() => ExperienceEntity, (experience) => experience.hr, {
        cascade: true,
    })
    experiences: ExperienceEntity[];

    @Column({ nullable: true })
    declarationId: string;

    @OneToOne(() => DeclarationEntity, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'declarationId' })
    declaration: DeclarationEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
