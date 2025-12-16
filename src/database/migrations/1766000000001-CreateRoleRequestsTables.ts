import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoleRequestsTables1766000000001 implements MigrationInterface {
    name = 'CreateRoleRequestsTables1766000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role_permissions_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "roleRequestId" uuid NOT NULL, "permissionId" uuid NOT NULL, "originalRolePermissionId" uuid, "action" character varying NOT NULL DEFAULT 'unchanged', "version" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7be279dfa974a131114558f1787" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."role_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "role_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "roleId" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "status" "public"."role_requests_status_enum" NOT NULL DEFAULT 'pending', "version" character varying, "requestedBy" uuid, "reviewedBy" uuid, "reviewedAt" TIMESTAMP, "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_32873821a9e1122603cc2fb86a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "version" character varying NOT NULL DEFAULT 'v1'`);
        await queryRunner.query(`ALTER TABLE "role_permissions_requests" ADD CONSTRAINT "FK_dd47eeb4bc62507eee0b7585fd0" FOREIGN KEY ("roleRequestId") REFERENCES "role_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permissions_requests" DROP CONSTRAINT "FK_dd47eeb4bc62507eee0b7585fd0"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "version"`);
        await queryRunner.query(`DROP TABLE "role_requests"`);
        await queryRunner.query(`DROP TYPE "public"."role_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "role_permissions_requests"`);
    }

}
