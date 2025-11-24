import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HumanResource } from "../../entities/human-resource.entity";
import { WarehouseDocument } from "../../../../warehouse/entities/warehouse-document.entity";

@Entity('professional_qualifications')
export class ProfessionalQualification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    humanResourceId: string;

    @Column({ type: 'varchar', length: 200 })
    certificationTitle: string;

    @Column({ type: 'varchar', length: 200 })
    issuingBody: string;

    @Column({ type: 'varchar', length: 100 })
    country: string;

    @Column({ type: 'date', nullable: true })
    dateOfAward: Date;

    @Column({ type: 'varchar', length: 100 })
    membershipNumber: string;

    @Column({ type: 'boolean', default: false })
    hasExpiryDate: boolean;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'professionalCertificate' })
    professionalCertificate: WarehouseDocument;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => HumanResource, (hr) => hr.professionalQualifications)
    @JoinColumn({ name: 'humanResourceId' })
    humanResource: HumanResource;
}
