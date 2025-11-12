import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Designation } from "../../../../common/entities/designation.entity";
import { WarehouseDocument } from "../../warehouse-document.entity";

@Entity('hr_personal_details')
export class PersonalDetailsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    designationId?: string;

    @ManyToOne(() => Designation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'designationId' })
    designation: Designation;

    @Column({ nullable: true })
    photographDocumentId?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'photographDocumentId' })
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

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
