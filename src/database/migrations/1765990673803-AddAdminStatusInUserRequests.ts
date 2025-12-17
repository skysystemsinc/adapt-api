import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminStatusInUserRequests1765990673803 implements MigrationInterface {
    name = 'AddAdminStatusInUserRequests1765990673803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_requests_adminstatus_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "user_requests" ADD "adminStatus" "public"."user_requests_adminstatus_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_requests" DROP COLUMN "adminStatus"`);
        await queryRunner.query(`DROP TYPE "public"."user_requests_adminstatus_enum"`);
    }

}
