import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("hr_declaration")
export class DeclarationEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 10 })
    writeOffAvailed: string;

    @Column({ type: "varchar", length: 10 })
    defaultOfFinance: string;

    @Column({ type: "varchar", length: 10 })
    placementOnECL: string;

    @Column({ type: "varchar", length: 10 })
    convictionPleaBargain: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

