import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WarehouseOperatorApplicationRequest } from "./warehouse-operator-application-request.entity";
import { AuditReportEntity } from "./financial/audit-report.entity";
import { TaxReturnEntity } from "./financial/tax-return.entity";
import { BankStatementEntity } from "./financial/bank-statement.entity";
import { OthersEntity } from "./financial/others.entity";

@Entity('financial_information')
export class FinancialInformationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    applicationId: string;

    @ManyToOne(() => WarehouseOperatorApplicationRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: WarehouseOperatorApplicationRequest;

    @Column({ nullable: true })
    auditReportId: string;

    @OneToOne(() => AuditReportEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auditReportId' })
    auditReport: AuditReportEntity;

    @OneToMany(() => TaxReturnEntity, (taxReturn) => taxReturn.financialInformation, {
        cascade: true,
    })
    taxReturns: TaxReturnEntity[];

    @OneToMany(() => BankStatementEntity, (bankStatement) => bankStatement.financialInformation, {
        cascade: true,
    })
    bankStatements: BankStatementEntity[];

    @OneToMany(() => OthersEntity, (other) => other.financialInformation, {
        cascade: true,
    })
    others: OthersEntity[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
