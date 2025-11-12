import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FinancialInformationEntity } from "../financial-information.entity";

@Entity('bank_statement')
export class BankStatementEntity {
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

    @Column({ type: 'varchar', length: 200, nullable: true })
    remarks: string;

    @Column({ nullable: true })
    financialInformationId: string;

    @ManyToOne(() => FinancialInformationEntity, (financialInformation) => financialInformation.bankStatements, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'financialInformationId' })
    financialInformation: FinancialInformationEntity;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

