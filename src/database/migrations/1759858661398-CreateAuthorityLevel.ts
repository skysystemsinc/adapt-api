import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthorityLevel1759858661398 implements MigrationInterface {
    name = 'CreateAuthorityLevel1759858661398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "authority_level" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f46fe6aabb1b96a087d501d8533" UNIQUE ("name"), CONSTRAINT "UQ_461ef36ed5b06d5b81fded0a414" UNIQUE ("slug"), CONSTRAINT "PK_4a0c40205e48e08bc0739bea98e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetExpires" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetExpires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`DROP TABLE "authority_level"`);
    }

}
