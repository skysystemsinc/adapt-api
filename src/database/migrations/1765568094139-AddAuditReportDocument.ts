import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditReportDocument1765568094139 implements MigrationInterface {
    name = 'AddAuditReportDocument1765568094139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_report" ADD "document" uuid`);
        await queryRunner.query(`ALTER TABLE "audit_report" ADD CONSTRAINT "FK_2f43fc3a998173e5f71381753f9" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_report" DROP CONSTRAINT "FK_2f43fc3a998173e5f71381753f9"`);
        await queryRunner.query(`ALTER TABLE "audit_report" DROP COLUMN "document"`);
    }

}
