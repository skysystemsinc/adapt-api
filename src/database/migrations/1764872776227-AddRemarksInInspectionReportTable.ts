import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRemarksInInspectionReportTable1764872776227 implements MigrationInterface {
    name = 'AddRemarksInInspectionReportTable1764872776227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "form_fields_requests" DROP COLUMN "systemKey"`);
        await queryRunner.query(`DROP TYPE "public"."form_fields_requests_systemkey_enum"`);
        await queryRunner.query(`ALTER TABLE "form_fields" DROP COLUMN "systemKey"`);
        await queryRunner.query(`DROP TYPE "public"."form_fields_systemkey_enum"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "remarks" text`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "approvedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD "approvedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD CONSTRAINT "FK_7565014f876844c63be69fd701e" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP CONSTRAINT "FK_7565014f876844c63be69fd701e"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "approvedAt"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "approvedBy"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP COLUMN "remarks"`);
        await queryRunner.query(`CREATE TYPE "public"."form_fields_systemkey_enum" AS ENUM('applicationType', 'businessType', 'companyName', 'nikCnic', 'dob', 'gender', 'email', 'phone', 'registrationNumber', 'address')`);
        await queryRunner.query(`ALTER TABLE "form_fields" ADD "systemKey" "public"."form_fields_systemkey_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."form_fields_requests_systemkey_enum" AS ENUM('applicationType', 'businessType', 'companyName', 'nikCnic', 'dob', 'gender', 'email', 'phone', 'registrationNumber', 'address')`);
        await queryRunner.query(`ALTER TABLE "form_fields_requests" ADD "systemKey" "public"."form_fields_requests_systemkey_enum"`);
    }

}
