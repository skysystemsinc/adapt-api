import { MigrationInterface, QueryRunner } from "typeorm";

export class EnhanceFormFields1761412122732 implements MigrationInterface {
    name = 'EnhanceFormFields1761412122732'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to form_fields table
        await queryRunner.query(`ALTER TABLE "form_fields" ADD "title" character varying`);
        await queryRunner.query(`ALTER TABLE "form_fields" ADD "placeholder" character varying`);
        await queryRunner.query(`ALTER TABLE "form_fields" ADD "validation" jsonb`);
        await queryRunner.query(`ALTER TABLE "form_fields" ADD "conditions" jsonb`);
        await queryRunner.query(`ALTER TABLE "form_fields" ALTER COLUMN "label" DROP NOT NULL`);
        
        // Mark schema column as deprecated in forms table
        await queryRunner.query(`COMMENT ON COLUMN "forms"."schema" IS 'DEPRECATED: Use form_fields table instead. Kept for backward compatibility only.'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "form_fields" ALTER COLUMN "label" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "form_fields" DROP COLUMN "conditions"`);
        await queryRunner.query(`ALTER TABLE "form_fields" DROP COLUMN "validation"`);
        await queryRunner.query(`ALTER TABLE "form_fields" DROP COLUMN "placeholder"`);
        await queryRunner.query(`ALTER TABLE "form_fields" DROP COLUMN "title"`);
    }

}
