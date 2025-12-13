import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FinancialInformationEntity } from "../financial-information.entity";
import { WarehouseDocument } from "../warehouse-document.entity";
import { OthersEntity } from "./others.entity";

@Entity('others_history')
export class OthersHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    othersId: string;

    @ManyToOne(() => OthersEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'othersId' })
    others: OthersEntity;

    @Column({ type: 'varchar', length: 100, nullable: false })
    documentType: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    documentName: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    periodStart: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    periodEnd: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    remarks: string;

    @Column({ nullable: true })
    financialInformationId: string;

    @ManyToOne(() => FinancialInformationEntity, (financialInformation) => financialInformation.others, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'financialInformationId' })
    financialInformation: FinancialInformationEntity;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'document' })
    document?: WarehouseDocument;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

