import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationTable1763903011369 implements MigrationInterface {
    name = 'CreateOrganizationTable1763903011369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."organization_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TYPE "public"."organization_type_enum" AS ENUM('INTERNAL', 'EXTERNAL')`);
        await queryRunner.query(`CREATE TABLE "organization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "status" "public"."organization_status_enum" NOT NULL DEFAULT 'active', "type" "public"."organization_type_enum" NOT NULL DEFAULT 'INTERNAL', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid, CONSTRAINT "UQ_aa6e74e96ed2dddfcf09782110a" UNIQUE ("code"), CONSTRAINT "UQ_c21e615583a3ebbb0977452afb0" UNIQUE ("name"), CONSTRAINT "UQ_a08804baa7c5d5427067c49a31f" UNIQUE ("slug"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "status_index" ON "organization" ("status") `);
        await queryRunner.query(`CREATE INDEX "type_index" ON "organization" ("type") `);
        await queryRunner.query(`ALTER TABLE "tax_return" ADD "document" uuid`);
        await queryRunner.query(`ALTER TABLE "bank_statement" ADD "document" uuid`);
        await queryRunner.query(`ALTER TABLE "financial_others" ADD "document" uuid`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD CONSTRAINT "UQ_79bad6b8ec15830e8d666eaf05d" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TYPE "public"."warehouse_operator_application_request_status_enum" RENAME TO "warehouse_operator_application_request_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operator_application_request_status_enum" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED', 'RESUBMITTED', 'SENT_TO_HOD')`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" TYPE "public"."warehouse_operator_application_request_status_enum" USING "status"::"text"::"public"."warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_application_request_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tax_return" ADD CONSTRAINT "FK_5b369333589e163dcfb2e14637d" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_statement" ADD CONSTRAINT "FK_4c70822ddbd990361ff7e445a80" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_others" ADD CONSTRAINT "FK_4779a5a00fc5f60d9d314e126d8" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD CONSTRAINT "FK_79bad6b8ec15830e8d666eaf05d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_d6e163bd2cfdd79045d0a95d94d" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_d6e163bd2cfdd79045d0a95d94d"`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP CONSTRAINT "FK_79bad6b8ec15830e8d666eaf05d"`);
        await queryRunner.query(`ALTER TABLE "financial_others" DROP CONSTRAINT "FK_4779a5a00fc5f60d9d314e126d8"`);
        await queryRunner.query(`ALTER TABLE "bank_statement" DROP CONSTRAINT "FK_4c70822ddbd990361ff7e445a80"`);
        await queryRunner.query(`ALTER TABLE "tax_return" DROP CONSTRAINT "FK_5b369333589e163dcfb2e14637d"`);
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operator_application_request_status_enum_old" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED', 'RESUBMITTED')`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" TYPE "public"."warehouse_operator_application_request_status_enum_old" USING "status"::"text"::"public"."warehouse_operator_application_request_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."warehouse_operator_application_request_status_enum_old" RENAME TO "warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP CONSTRAINT "UQ_79bad6b8ec15830e8d666eaf05d"`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "financial_others" DROP COLUMN "document"`);
        await queryRunner.query(`ALTER TABLE "bank_statement" DROP COLUMN "document"`);
        await queryRunner.query(`ALTER TABLE "tax_return" DROP COLUMN "document"`);
        await queryRunner.query(`DROP INDEX "public"."type_index"`);
        await queryRunner.query(`DROP INDEX "public"."status_index"`);
        await queryRunner.query(`DROP TABLE "organization"`);
        await queryRunner.query(`DROP TYPE "public"."organization_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."organization_status_enum"`);
    }

}
