import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuthorizedSignatoriesTableAddColumn1762530490918 implements MigrationInterface {
    name = 'UpdateAuthorizedSignatoriesTableAddColumn1762530490918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "authorized_signatories" ADD "authorizedSignatoryName" character varying(200) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "authorized_signatories" DROP COLUMN "authorizedSignatoryName"`);
    }

}
