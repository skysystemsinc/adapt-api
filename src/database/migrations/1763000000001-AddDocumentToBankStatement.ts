import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentToBankStatement1763000000001 implements MigrationInterface {
    name = 'AddDocumentToBankStatement1763000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bank_statement" ADD "document" uuid`);
        await queryRunner.query(`ALTER TABLE "bank_statement" ADD CONSTRAINT "FK_bank_statement_document" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bank_statement" DROP CONSTRAINT "FK_bank_statement_document"`);
        await queryRunner.query(`ALTER TABLE "bank_statement" DROP COLUMN "document"`);
    }

}

