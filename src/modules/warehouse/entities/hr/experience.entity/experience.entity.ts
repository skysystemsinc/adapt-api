import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { HrEntity } from "../../hr.entity";
import { WarehouseDocument } from "../../warehouse-document.entity";

@Entity("hr_experience")
export class ExperienceEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 150 })
    positionHeld: string;

    @Column({ type: "varchar", length: 180 })
    organizationName: string;

    @Column({ type: "varchar", length: 255 })
    organizationAddress: string;

    @Column({ type: "varchar", length: 120 })
    natureOfOrganization: string;

    @Column({ type: "varchar", length: 20 })
    dateOfAppointment: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    dateOfLeaving: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    duration: string | null;

    @Column({ type: "text", nullable: true })
    responsibilities: string | null;

    @Column({ nullable: true })
    experienceLetter?: string | null;

    @ManyToOne(() => WarehouseDocument, { onDelete: "SET NULL" })
    @JoinColumn({ name: "experienceLetter" })
    experienceLetterDocument?: WarehouseDocument;

    @Column({ nullable: true })
    hrId: string;

    @ManyToOne(() => HrEntity, (hr) => hr.experiences, { onDelete: "CASCADE" })
    @JoinColumn({ name: "hrId" })
    hr: HrEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

