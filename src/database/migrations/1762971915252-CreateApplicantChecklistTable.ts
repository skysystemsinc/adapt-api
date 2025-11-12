import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApplicantChecklistTable1762971915252 implements MigrationInterface {
    name = 'CreateApplicantChecklistTable1762971915252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "human_resources_checklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "qcPersonnel" boolean NOT NULL DEFAULT false, "qcPersonnelFile" uuid, "warehouseSupervisor" boolean NOT NULL DEFAULT false, "warehouseSupervisorFile" uuid, "dataEntryOperator" boolean NOT NULL DEFAULT false, "dataEntryOperatorFile" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_f338ba9a1a9d02f08f2f248c87c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "financial_soundness_checklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auditedFinancialStatements" boolean NOT NULL DEFAULT false, "auditedFinancialStatementsFile" uuid, "positiveNetWorth" boolean NOT NULL DEFAULT false, "positiveNetWorthFile" uuid, "noLoanDefaults" boolean NOT NULL DEFAULT false, "noLoanDefaultsFile" uuid, "cleanCreditHistory" boolean NOT NULL DEFAULT false, "cleanCreditHistoryFile" uuid, "adequateWorkingCapital" boolean NOT NULL DEFAULT false, "adequateWorkingCapitalFile" uuid, "validInsuranceCoverage" boolean NOT NULL DEFAULT false, "validInsuranceCoverageFile" uuid, "noFinancialFraud" boolean NOT NULL DEFAULT false, "noFinancialFraudFile" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_5d968779ba39083bba682101d9c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "registration_fee_checklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bankPaymentSlip" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_16b4889cd6faae2972a85a21789" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "declaration_checklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "informationTrueComplete" boolean NOT NULL DEFAULT false, "authorizeVerification" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_4459c2de3b61a280716c0e70511" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "applicant_checklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "humanResourcesId" uuid, "financialSoundnessId" uuid, "registrationFeeId" uuid, "declarationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_96c0a9fb207c8b021562368088" UNIQUE ("humanResourcesId"), CONSTRAINT "REL_e7c2c9a89cc8dee94757533871" UNIQUE ("financialSoundnessId"), CONSTRAINT "REL_78a61dbca7874c733762672005" UNIQUE ("registrationFeeId"), CONSTRAINT "REL_36aa93dcb6a5d9c2377c585dbc" UNIQUE ("declarationId"), CONSTRAINT "PK_70279ccbfc9905d0399feb08d79" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" ADD CONSTRAINT "FK_7ebb8f99c99ba44fe01add49a9f" FOREIGN KEY ("qcPersonnelFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" ADD CONSTRAINT "FK_d690b87ed7b7ace3723c04059a7" FOREIGN KEY ("warehouseSupervisorFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" ADD CONSTRAINT "FK_9ab230d901132689fc55d2b9824" FOREIGN KEY ("dataEntryOperatorFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" ADD CONSTRAINT "FK_92a3106602fea531d8cd701a0a3" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_124a76f7c1a7f0971dad5655750" FOREIGN KEY ("auditedFinancialStatementsFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_de99532d87fd349af12366a3cc6" FOREIGN KEY ("positiveNetWorthFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_216da71899d6ea50db313eba3c6" FOREIGN KEY ("noLoanDefaultsFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_ae89833a7da346c0db4cdc0b995" FOREIGN KEY ("cleanCreditHistoryFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_8456a4497c154f09a03c6c7e40e" FOREIGN KEY ("adequateWorkingCapitalFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_9db8fa1688244d33eefc5031da9" FOREIGN KEY ("validInsuranceCoverageFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_0180175ac6513f711f97e22a8f7" FOREIGN KEY ("noFinancialFraudFile") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" ADD CONSTRAINT "FK_70621c569b87185725b0e90bfc9" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist" ADD CONSTRAINT "FK_6c5b7736faf04d4deb293961795" FOREIGN KEY ("bankPaymentSlip") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist" ADD CONSTRAINT "FK_11fa74a3345edebc987a979b26a" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "declaration_checklist" ADD CONSTRAINT "FK_66644b22a7abad901321cb6734d" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" ADD CONSTRAINT "FK_aa3701fffa22ccb8374a5a34ef1" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" ADD CONSTRAINT "FK_96c0a9fb207c8b0215623680881" FOREIGN KEY ("humanResourcesId") REFERENCES "human_resources_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" ADD CONSTRAINT "FK_e7c2c9a89cc8dee94757533871d" FOREIGN KEY ("financialSoundnessId") REFERENCES "financial_soundness_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" ADD CONSTRAINT "FK_78a61dbca7874c7337626720056" FOREIGN KEY ("registrationFeeId") REFERENCES "registration_fee_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" ADD CONSTRAINT "FK_36aa93dcb6a5d9c2377c585dbc2" FOREIGN KEY ("declarationId") REFERENCES "declaration_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applicant_checklist" DROP CONSTRAINT "FK_36aa93dcb6a5d9c2377c585dbc2"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" DROP CONSTRAINT "FK_78a61dbca7874c7337626720056"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" DROP CONSTRAINT "FK_e7c2c9a89cc8dee94757533871d"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" DROP CONSTRAINT "FK_96c0a9fb207c8b0215623680881"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist" DROP CONSTRAINT "FK_aa3701fffa22ccb8374a5a34ef1"`);
        await queryRunner.query(`ALTER TABLE "declaration_checklist" DROP CONSTRAINT "FK_66644b22a7abad901321cb6734d"`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist" DROP CONSTRAINT "FK_11fa74a3345edebc987a979b26a"`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist" DROP CONSTRAINT "FK_6c5b7736faf04d4deb293961795"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_70621c569b87185725b0e90bfc9"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_0180175ac6513f711f97e22a8f7"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_9db8fa1688244d33eefc5031da9"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_8456a4497c154f09a03c6c7e40e"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_ae89833a7da346c0db4cdc0b995"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_216da71899d6ea50db313eba3c6"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_de99532d87fd349af12366a3cc6"`);
        await queryRunner.query(`ALTER TABLE "financial_soundness_checklist" DROP CONSTRAINT "FK_124a76f7c1a7f0971dad5655750"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" DROP CONSTRAINT "FK_92a3106602fea531d8cd701a0a3"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" DROP CONSTRAINT "FK_9ab230d901132689fc55d2b9824"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" DROP CONSTRAINT "FK_d690b87ed7b7ace3723c04059a7"`);
        await queryRunner.query(`ALTER TABLE "human_resources_checklist" DROP CONSTRAINT "FK_7ebb8f99c99ba44fe01add49a9f"`);
        await queryRunner.query(`DROP TABLE "applicant_checklist"`);
        await queryRunner.query(`DROP TABLE "declaration_checklist"`);
        await queryRunner.query(`DROP TABLE "registration_fee_checklist"`);
        await queryRunner.query(`DROP TABLE "financial_soundness_checklist"`);
        await queryRunner.query(`DROP TABLE "human_resources_checklist"`);
    }

}
