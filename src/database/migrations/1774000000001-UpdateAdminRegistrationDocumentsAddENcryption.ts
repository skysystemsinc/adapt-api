import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAdminRegistrationDocumentsAddENcryption1774000000001 implements MigrationInterface {
    name = 'UpdateAdminRegistrationDocumentsAddENcryption1774000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD COLUMN IF NOT EXISTS "iv" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD COLUMN IF NOT EXISTS "authTag" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD COLUMN IF NOT EXISTS "originalName" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD COLUMN IF NOT EXISTS "mimeType" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD COLUMN IF NOT EXISTS "size" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "size"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "mimeType"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "originalName"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "authTag"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "iv"`);
    }

}
