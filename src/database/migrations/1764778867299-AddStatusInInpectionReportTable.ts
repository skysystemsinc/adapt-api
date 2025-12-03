import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusInInpectionReportTable1764778867299 implements MigrationInterface {
    name = 'AddStatusInInpectionReportTable1764778867299'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."inspection_reports_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'UNDER_REVIEW', 'RESUBMITTED')`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "status" "public"."inspection_reports_status_enum" NOT NULL DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."inspection_reports_status_enum"`);
    }

}
