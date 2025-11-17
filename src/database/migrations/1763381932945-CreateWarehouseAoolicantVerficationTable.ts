import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWarehouseAoolicantVerficationTable1763381932945 implements MigrationInterface {
    name = 'CreateWarehouseAoolicantVerficationTable1763381932945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."warehouse_applicant_verifications_entitytype_enum" AS ENUM('applicant_checklist', 'declaration_checklist', 'financial_soundness_checklist', 'human_resources_checklist', 'registration_fee_checklist', 'company_information', 'authorized_signatories', 'bank_details', 'hrs', 'hr_academic_qualifications', 'hr_declaration', 'hr_experience', 'hr_personal_details', 'hr_professional_qualifications', 'hr_trainings', 'financial_information', 'audit_report', 'bank_statement', 'financial_others', 'tax_return')`);
        await queryRunner.query(`CREATE TYPE "public"."warehouse_applicant_verifications_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW')`);
        await queryRunner.query(`CREATE TABLE "warehouse_applicant_verifications" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "entityType" "public"."warehouse_applicant_verifications_entitytype_enum" NOT NULL, "fieldKey" character varying NOT NULL, "fieldValue" text, "status" "public"."warehouse_applicant_verifications_status_enum" NOT NULL DEFAULT 'PENDING', "remarks" text, "approvedBy" integer, "rejectedBy" integer, "approvedAt" TIMESTAMP, "rejectedAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0ea6e9de7a8efc14cbd7e8a187d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "warehouse_applicant_verifications"`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_applicant_verifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_applicant_verifications_entitytype_enum"`);
    }

}
