import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HrEntity } from "../../hr.entity";

@Entity("professional_qualifications")
export class ProfessionalQualificationsEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 150 })
    certificationTitle: string;

    @Column({ type: "varchar", length: 150 })
    issuingBody: string;

    @Column({ type: "varchar", length: 100 })
    country: string;

    @Column({ type: "varchar", length: 20 })
    dateOfAward: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    validity: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    membershipNumber: string | null;

    @Column({ nullable: true })
    hrId: string;

    @ManyToOne(() => HrEntity, (hr) => hr.professionalQualifications, { onDelete: "CASCADE" })
    @JoinColumn({ name: "hrId" })
    hr: HrEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

