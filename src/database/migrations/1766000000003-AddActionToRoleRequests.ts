import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActionToRoleRequests1766000000003 implements MigrationInterface {
    name = 'AddActionToRoleRequests1766000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add action column to role_requests table with default 'update'
        await queryRunner.query(`ALTER TABLE "role_requests" ADD COLUMN "action" character varying NOT NULL DEFAULT 'update'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove action column
        await queryRunner.query(`ALTER TABLE "role_requests" DROP COLUMN "action"`);
    }
}
