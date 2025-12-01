import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateInspectionReportTableEntities1764595982395 implements MigrationInterface {
    name = 'UpdateInspectionReportTableEntities1764595982395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "maximumScore"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "maximumScore" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "obtainedScore"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "obtainedScore" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "percentage"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "percentage" numeric(5,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "percentage"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "percentage" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "obtainedScore"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "obtainedScore" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "maximumScore"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "maximumScore" character varying(50) NOT NULL`);
    }

}
