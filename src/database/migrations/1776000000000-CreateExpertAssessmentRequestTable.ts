import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExpertAssessmentRequestTable1766404276675 implements MigrationInterface {
    name = 'CreateExpertAssessmentRequestTable1766404276675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."expert_assessment_requests_category_enum" AS ENUM('financial', 'hr', 'legal', 'security', 'technical', 'ecg')`);
        await queryRunner.query(`CREATE TYPE "public"."expert_assessment_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "expert_assessment_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assessmentId" uuid, "name" character varying(255) NOT NULL, "category" "public"."expert_assessment_requests_category_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "originalData" jsonb, "status" "public"."expert_assessment_requests_status_enum" NOT NULL DEFAULT 'pending', "action" character varying NOT NULL DEFAULT 'update', "requestedBy" uuid, "reviewedBy" uuid, "reviewedAt" TIMESTAMP, "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_781ce46295bd33bd5b70cf209cf" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "expert_assessment_requests"`);
        await queryRunner.query(`DROP TYPE "public"."expert_assessment_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."expert_assessment_requests_category_enum"`);
    }

}
