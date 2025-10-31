import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRegistrationApplication1761667400855 implements MigrationInterface {
    name = 'UpdateRegistrationApplication1761667400855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_application" ADD "formId" character varying`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD "metadata" jsonb`);
        await queryRunner.query(`COMMENT ON COLUMN "forms"."schema" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "forms"."schema" IS 'DEPRECATED: Use form_fields table instead. Kept for backward compatibility only.'`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD "metadata" text`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP COLUMN "formId"`);
    }

}
