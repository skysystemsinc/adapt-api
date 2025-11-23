import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationIdToUsers1763903981345 implements MigrationInterface {
    name = 'AddOrganizationIdToUsers1763903981345'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);
    }

}
