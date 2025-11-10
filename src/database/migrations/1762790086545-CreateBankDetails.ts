import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBankDetails1762790086545 implements MigrationInterface {
    name = 'CreateBankDetails1762790086545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bank_details_status_enum" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'RESUBMITTED')`);
        await queryRunner.query(`CREATE TABLE "bank_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "name" character varying(200) NOT NULL, "accountTitle" character varying(200) NOT NULL, "iban" character varying(24) NOT NULL, "accountType" character varying(100), "branchAddress" character varying(200), "status" "public"."bank_details_status_enum" NOT NULL DEFAULT 'DRAFT', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ddbbcb9586b7f4d6124fe58f257" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bank_details" ADD CONSTRAINT "FK_f91dcfe6b299c2df76df0a98ce7" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bank_details" DROP CONSTRAINT "FK_f91dcfe6b299c2df76df0a98ce7"`);
        await queryRunner.query(`DROP TABLE "bank_details"`);
        await queryRunner.query(`DROP TYPE "public"."bank_details_status_enum"`);
    }

}
