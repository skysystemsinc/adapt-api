import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeRoleIdNullableInRoleRequests1765282565342 implements MigrationInterface {
    name = 'MakeRoleIdNullableInRoleRequests1765282565342'

   
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make roleId nullable in role_requests table to support new role creation
        await queryRunner.query(`ALTER TABLE "role_requests" ALTER COLUMN "roleId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: make roleId NOT NULL again
        // First, we need to ensure there are no NULL values
        await queryRunner.query(`UPDATE "role_requests" SET "roleId" = (SELECT id FROM roles LIMIT 1) WHERE "roleId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "role_requests" ALTER COLUMN "roleId" SET NOT NULL`);
    }
}
