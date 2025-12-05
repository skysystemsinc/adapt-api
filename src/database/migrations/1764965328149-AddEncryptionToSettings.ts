import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEncryptionToSettings1764965328149 implements MigrationInterface {
    name = 'AddEncryptionToSettings1764965328149'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ADD "iv" text`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "authTag" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "authTag"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "iv"`);
    }

}
