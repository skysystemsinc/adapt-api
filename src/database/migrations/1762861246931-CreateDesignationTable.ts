import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDesignationTable1762861246931 implements MigrationInterface {
    name = 'CreateDesignationTable1762861246931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "designations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying, "slug" character varying(200) NOT NULL, "name" character varying(200) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a0f024b99b1491a03fc421858ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."warehouse_operator_application_request_status_enum" RENAME TO "warehouse_operator_application_request_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operator_application_request_status_enum" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED', 'RESUBMITTED')`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" TYPE "public"."warehouse_operator_application_request_status_enum" USING "status"::"text"::"public"."warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_application_request_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operator_application_request_status_enum_old" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED')`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" TYPE "public"."warehouse_operator_application_request_status_enum_old" USING "status"::"text"::"public"."warehouse_operator_application_request_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."warehouse_operator_application_request_status_enum_old" RENAME TO "warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "designations"`);
    }

}
