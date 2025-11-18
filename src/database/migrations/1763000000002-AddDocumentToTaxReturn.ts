import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentToTaxReturn1763000000002 implements MigrationInterface {
    name = 'AddDocumentToTaxReturn1763000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tax_return" ADD "document" uuid`);
        await queryRunner.query(`ALTER TABLE "tax_return" ADD CONSTRAINT "FK_tax_return_document" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tax_return" DROP CONSTRAINT "FK_tax_return_document"`);
        await queryRunner.query(`ALTER TABLE "tax_return" DROP COLUMN "document"`);
    }

}

