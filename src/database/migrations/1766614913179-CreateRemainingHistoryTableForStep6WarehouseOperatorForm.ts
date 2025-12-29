import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRemainingHistoryTableForStep6WarehouseOperatorForm1766614913179 implements MigrationInterface {
    name = 'CreateRemainingHistoryTableForStep6WarehouseOperatorForm1766614913179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "financial_soundness_checklist_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "financialSoundnessChecklistId" uuid NOT NULL, "auditedFinancialStatements" boolean NOT NULL DEFAULT false, "auditedFinancialStatementsFile" uuid, "positiveNetWorth" boolean NOT NULL DEFAULT false, "positiveNetWorthFile" uuid, "noLoanDefaults" boolean NOT NULL DEFAULT false, "noLoanDefaultsFile" uuid, "cleanCreditHistory" boolean NOT NULL DEFAULT false, "cleanCreditHistoryFile" uuid, "adequateWorkingCapital" boolean NOT NULL DEFAULT false, "adequateWorkingCapitalFile" uuid, "validInsuranceCoverage" boolean NOT NULL DEFAULT false, "validInsuranceCoverageFile" uuid, "noFinancialFraud" boolean NOT NULL DEFAULT false, "noFinancialFraudFile" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_58457dc766962f3f03b24b730db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "human_resources_checklist_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "humanResourcesChecklistId" uuid NOT NULL, "qcPersonnel" boolean NOT NULL DEFAULT false, "qcPersonnelFile" uuid, "warehouseSupervisor" boolean NOT NULL DEFAULT false, "warehouseSupervisorFile" uuid, "dataEntryOperator" boolean NOT NULL DEFAULT false, "dataEntryOperatorFile" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_37b1077d9809ca44224af471840" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_d03bdb15678733c6761961ee54a" FOREIGN KEY ("financialSoundnessChecklistId") REFERENCES "financial_soundness_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_bb93236256b2626d55011edbd0d" FOREIGN KEY ("auditedFinancialStatementsFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_32d97553ffeba225bd3b456ca9d" FOREIGN KEY ("positiveNetWorthFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_7d01b616aae43244dfc20660353" FOREIGN KEY ("noLoanDefaultsFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_f3be682a328abddb7661a12d592" FOREIGN KEY ("cleanCreditHistoryFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_4a6c9c1d7a52bab579429d1ee56" FOREIGN KEY ("adequateWorkingCapitalFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_1d4fedf69be2cf9a4f2a27b8f67" FOREIGN KEY ("validInsuranceCoverageFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_2f86d1cdd65292c288a4e5ea6f2" FOREIGN KEY ("noFinancialFraudFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" ADD CONSTRAINT "FK_5dd4620b43a215245cd1258d7b0" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" ADD CONSTRAINT "FK_9bcf362f3107df30787e32a444d" FOREIGN KEY ("humanResourcesChecklistId") REFERENCES "human_resources_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" ADD CONSTRAINT "FK_8190043597ba132cc542bfa57b1" FOREIGN KEY ("qcPersonnelFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" ADD CONSTRAINT "FK_b8e99ccba23800747f186da4444" FOREIGN KEY ("warehouseSupervisorFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" ADD CONSTRAINT "FK_d0d52ec88f64ee801b05b08ef3b" FOREIGN KEY ("dataEntryOperatorFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" ADD CONSTRAINT "FK_672bfe8c557718121791f3b8068" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" DROP CONSTRAINT "FK_672bfe8c557718121791f3b8068"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" DROP CONSTRAINT "FK_d0d52ec88f64ee801b05b08ef3b"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" DROP CONSTRAINT "FK_b8e99ccba23800747f186da4444"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" DROP CONSTRAINT "FK_8190043597ba132cc542bfa57b1"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist_history" DROP CONSTRAINT "FK_9bcf362f3107df30787e32a444d"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_5dd4620b43a215245cd1258d7b0"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_2f86d1cdd65292c288a4e5ea6f2"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_1d4fedf69be2cf9a4f2a27b8f67"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_4a6c9c1d7a52bab579429d1ee56"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_f3be682a328abddb7661a12d592"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_7d01b616aae43244dfc20660353"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_32d97553ffeba225bd3b456ca9d"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_bb93236256b2626d55011edbd0d"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist_history" DROP CONSTRAINT "FK_d03bdb15678733c6761961ee54a"`);
        await queryRunner.query(`DROP TABLE "human_resources_checklist_history"`);
        await queryRunner.query(`DROP TABLE "financial_soundness_checklist_history"`);
    }

}
