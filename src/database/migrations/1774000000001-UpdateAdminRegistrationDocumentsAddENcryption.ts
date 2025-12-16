import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAdminRegistrationDocumentsAddENcryption1774000000001 implements MigrationInterface {
    name = 'UpdateAdminRegistrationDocumentsAddENcryption1774000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD "iv" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD "authTag" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD "originalName" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD "mimeType" text`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" ADD "size" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "size"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "mimeType"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "originalName"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "authTag"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP COLUMN "iv"`);
    }

}
