import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentToFinancialOthers1763000000000 implements MigrationInterface {
    name = 'AddDocumentToFinancialOthers1763000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "financial_others" ADD "document" uuid`);
        await queryRunner.query(`ALTER TABLE "financial_others" ADD CONSTRAINT "FK_financial_others_document" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "financial_others" DROP CONSTRAINT "FK_financial_others_document"`);
        await queryRunner.query(`ALTER TABLE "financial_others" DROP COLUMN "document"`);
    }

}

