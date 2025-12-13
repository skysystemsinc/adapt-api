import { Column, CreateDateColumn, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DeclarationEntity } from "./declaration.entity";

@Entity("hr_declaration_history")
export class DeclarationHistoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: 'uuid', nullable: false })
    declarationId: string;

    @ManyToOne(() => DeclarationEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'declarationId' })
    declaration: DeclarationEntity;

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

