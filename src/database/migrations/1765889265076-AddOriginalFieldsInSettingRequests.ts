import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOriginalFieldsInSettingRequests1765889265076 implements MigrationInterface {
    name = 'AddOriginalFieldsInSettingRequests1765889265076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "setting_requests" ADD "originalValue" text`);
        await queryRunner.query(`ALTER TABLE "setting_requests" ADD "originalMimeType" text`);
        await queryRunner.query(`ALTER TABLE "setting_requests" ADD "originalOriginalName" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "setting_requests" DROP COLUMN "originalOriginalName"`);
        await queryRunner.query(`ALTER TABLE "setting_requests" DROP COLUMN "originalMimeType"`);
        await queryRunner.query(`ALTER TABLE "setting_requests" DROP COLUMN "originalValue"`);
    }

}
