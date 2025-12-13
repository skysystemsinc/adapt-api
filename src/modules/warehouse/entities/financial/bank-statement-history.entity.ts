import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FinancialInformationEntity } from "../financial-information.entity";
import { WarehouseDocument } from "../warehouse-document.entity";
import { BankStatementEntity } from "./bank-statement.entity";

@Entity('bank_statement_history')
export class BankStatementHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    bankStatementId: string;

    @ManyToOne(() => BankStatementEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bankStatementId' })
    bankStatement: BankStatementEntity;

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

    @ManyToOne(() => FinancialInformationEntity, (financialInformation) => financialInformation.bankStatements, { onDelete: 'CASCADE' })
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

