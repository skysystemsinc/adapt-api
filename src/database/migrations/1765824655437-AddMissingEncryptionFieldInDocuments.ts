import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingEncryptionFieldInDocuments1765824655437 implements MigrationInterface {
    name = 'AddMissingEncryptionFieldInDocuments1765824655437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD "iv" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD "authTag" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP COLUMN "authTag"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP COLUMN "iv"`);
    }

}
