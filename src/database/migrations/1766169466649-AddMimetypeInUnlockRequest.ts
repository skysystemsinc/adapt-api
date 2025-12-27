import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMimetypeInUnlockRequest1766169466649 implements MigrationInterface {
    name = 'AddMimetypeInUnlockRequest1766169466649'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "unlock_requests" ADD "mimeType" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ADD "originalFileName" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "unlock_requests" DROP COLUMN "originalFileName"`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" DROP COLUMN "mimeType"`);
    }

}
