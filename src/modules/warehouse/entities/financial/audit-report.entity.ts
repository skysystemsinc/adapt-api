import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FinancialInformationEntity } from "../financial-information.entity";
import { WarehouseDocument } from "../warehouse-document.entity";

@Entity('audit_report')
export class AuditReportEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    documentType: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    documentName: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    periodStart: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    periodEnd: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    assets: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    liabilities: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    equity: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    revenue: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    netProfitLoss: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    remarks: string;

    @ManyToOne(() => WarehouseDocument, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'document' })
    document?: WarehouseDocument;

    @Column({ nullable: true })
    financialInformationId: string;

    @ManyToOne(() => FinancialInformationEntity, (financialInformation) => financialInformation.auditReport, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'financialInformationId' })
    financialInformation: FinancialInformationEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
