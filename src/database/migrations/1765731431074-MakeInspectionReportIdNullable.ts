import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeInspectionReportIdNullable1765731431074 implements MigrationInterface {
    name = 'MakeInspectionReportIdNullable1765731431074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" DROP CONSTRAINT "FK_1b647fecf09c8e4ea34591f38a3"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ALTER COLUMN "inspectionReportId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ADD CONSTRAINT "FK_1b647fecf09c8e4ea34591f38a3" FOREIGN KEY ("inspectionReportId") REFERENCES "inspection_reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" DROP CONSTRAINT "FK_1b647fecf09c8e4ea34591f38a3"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ALTER COLUMN "inspectionReportId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ADD CONSTRAINT "FK_1b647fecf09c8e4ea34591f38a3" FOREIGN KEY ("inspectionReportId") REFERENCES "inspection_reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
