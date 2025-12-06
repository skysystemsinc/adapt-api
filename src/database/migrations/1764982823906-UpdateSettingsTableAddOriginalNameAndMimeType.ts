import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSettingsTableAddOriginalNameAndMimeType1764982823906 implements MigrationInterface {
    name = 'UpdateSettingsTableAddOriginalNameAndMimeType1764982823906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ADD "originalName" text`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "mimeType" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "mimeType"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "originalName"`);
    }

}
