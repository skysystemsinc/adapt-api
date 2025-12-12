import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Designation } from "../../../../common/entities/designation.entity";
import { WarehouseDocument } from "../../warehouse-document.entity";
import { PersonalDetailsEntity } from "./personal-details.entity";

@Entity('hr_personal_details_history')
export class PersonalDetailsHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    designationId?: string;

    @ManyToOne(() => Designation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'designationId' })
    designation: Designation;

    @Column({ type: 'uuid', nullable: false })
    personalDetailsId: string;

    @ManyToOne(() => PersonalDetailsEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'personalDetailsId' })
    personalDetails: PersonalDetailsEntity;

    @Column({ nullable: true })
    photograph?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'photograph' })
    photographDocument?: WarehouseDocument;

    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    fathersHusbandName: string;

    @Column({ type: 'varchar', length: 13, nullable: false })
    cnicPassport: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    nationality: string;

    @Column({ type: 'date', nullable: false })
    dateOfBirth: Date;

    @Column({ type: 'text', nullable: false })
    residentialAddress: string;

    @Column({ type: 'text', nullable: true })
    businessAddress: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    telephone: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    mobileNumber: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nationalTaxNumber: string;

    @Column({ default: false })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
