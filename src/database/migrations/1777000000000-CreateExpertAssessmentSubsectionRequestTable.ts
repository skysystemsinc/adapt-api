import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExpertAssessmentSubsectionRequestTable1766407703245 implements MigrationInterface {
    name = 'CreateExpertAssessmentSubsectionRequestTable1766407703245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assessment_sub_section_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "assessment_sub_section_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subSectionId" uuid, "assessmentId" uuid NOT NULL, "name" character varying(255) NOT NULL, "order" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "originalData" jsonb, "status" "public"."assessment_sub_section_requests_status_enum" NOT NULL DEFAULT 'pending', "action" character varying NOT NULL DEFAULT 'update', "requestedBy" uuid, "reviewedBy" uuid, "reviewedAt" TIMESTAMP, "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_77e813515cc996a886ab922a7b3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "assessment_sub_section_requests"`);
        await queryRunner.query(`DROP TYPE "public"."assessment_sub_section_requests_status_enum"`);
    }
}
