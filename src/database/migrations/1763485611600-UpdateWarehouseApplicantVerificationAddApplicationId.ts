import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWarehouseApplicantVerificationAddApplicationId1763485611600 implements MigrationInterface {
    name = 'UpdateWarehouseApplicantVerificationAddApplicationId1763485611600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tax_return" DROP CONSTRAINT "FK_tax_return_document"`);
        await queryRunner.query(`ALTER TABLE "bank_statement" DROP CONSTRAINT "FK_bank_statement_document"`);
        await queryRunner.query(`ALTER TABLE "financial_others" DROP CONSTRAINT "FK_financial_others_document"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "applicationId" uuid`);
        await queryRunner.query(`ALTER TABLE "tax_return" ADD CONSTRAINT "FK_5b369333589e163dcfb2e14637d" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_statement" ADD CONSTRAINT "FK_4c70822ddbd990361ff7e445a80" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_others" ADD CONSTRAINT "FK_4779a5a00fc5f60d9d314e126d8" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD CONSTRAINT "FK_afca0a7b03ef60e06c51f4744f2" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP CONSTRAINT "FK_afca0a7b03ef60e06c51f4744f2"`);
        await queryRunner.query(`ALTER TABLE "financial_others" DROP CONSTRAINT "FK_4779a5a00fc5f60d9d314e126d8"`);
        await queryRunner.query(`ALTER TABLE "bank_statement" DROP CONSTRAINT "FK_4c70822ddbd990361ff7e445a80"`);
        await queryRunner.query(`ALTER TABLE "tax_return" DROP CONSTRAINT "FK_5b369333589e163dcfb2e14637d"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "financial_others" ADD CONSTRAINT "FK_financial_others_document" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_statement" ADD CONSTRAINT "FK_bank_statement_document" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_return" ADD CONSTRAINT "FK_tax_return_document" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
