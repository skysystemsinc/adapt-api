import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserRequestTables1765901911322 implements MigrationInterface {
    name = 'CreateUserRequestTables1765901911322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "user_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "email" character varying, "firstName" character varying, "lastName" character varying, "roleId" uuid, "organizationId" uuid, "isActive" boolean, "status" "public"."user_requests_status_enum" NOT NULL DEFAULT 'pending', "action" character varying NOT NULL DEFAULT 'update', "requestedBy" uuid, "reviewedBy" uuid, "reviewedAt" TIMESTAMP, "reviewNotes" text, "originalEmail" character varying, "originalFirstName" character varying, "originalLastName" character varying, "originalRoleId" uuid, "originalOrganizationId" uuid, "originalIsActive" boolean, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b144147b72ee6fb3d4a9147073e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_requests" ADD CONSTRAINT "FK_97d5891eebc1df1ce0e13de9bef" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_requests" DROP CONSTRAINT "FK_97d5891eebc1df1ce0e13de9bef"`);
        await queryRunner.query(`DROP TABLE "user_requests"`);
        await queryRunner.query(`DROP TYPE "public"."user_requests_status_enum"`);
    }

}
