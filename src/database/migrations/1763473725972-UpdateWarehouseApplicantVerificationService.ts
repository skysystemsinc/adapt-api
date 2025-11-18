import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWarehouseApplicantVerificationService1763473725972 implements MigrationInterface {
    name = 'UpdateWarehouseApplicantVerificationService1763473725972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "registration_application" DROP CONSTRAINT "FK_79bad6b8ec15830e8d666eaf05d"`);
        // await queryRunner.query(`ALTER TABLE "registration_application" DROP CONSTRAINT "UQ_79bad6b8ec15830e8d666eaf05d"`);
        // await queryRunner.query(`ALTER TABLE "registration_application" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "approvedBy"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "approvedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "rejectedBy"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "rejectedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD CONSTRAINT "FK_4f3f763cc16d321fd6c7fcfefb9" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD CONSTRAINT "FK_83161ccd659b3e66b65991baead" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP CONSTRAINT "FK_83161ccd659b3e66b65991baead"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP CONSTRAINT "FK_4f3f763cc16d321fd6c7fcfefb9"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "rejectedBy"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "rejectedBy" integer`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "approvedBy"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "approvedBy" integer`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD CONSTRAINT "UQ_79bad6b8ec15830e8d666eaf05d" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD CONSTRAINT "FK_79bad6b8ec15830e8d666eaf05d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
