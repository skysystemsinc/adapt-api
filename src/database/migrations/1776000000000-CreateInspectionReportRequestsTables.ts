import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInspectionReportRequestsTables1766077255643 implements MigrationInterface {
    name = 'CreateInspectionReportRequestsTables1766077255643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assessment_submission_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inspectionReportRequestId" uuid NOT NULL, "assessmentId" uuid NOT NULL, "score" numeric(5,2), "remarks" text, "filePath" text, "fileIv" text, "fileAuthTag" text, "fileMimeType" text, "fileOriginalName" text, "originalData" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1aff32db83537a2c88d17f25178" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."inspection_report_requests_assessmenttype_enum" AS ENUM('financial', 'hr', 'legal', 'security', 'technical', 'ecg')`);
        await queryRunner.query(`CREATE TYPE "public"."inspection_report_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "inspection_report_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inspectionReportId" uuid, "assessmentType" "public"."inspection_report_requests_assessmenttype_enum" NOT NULL, "maximumScore" numeric(10,2) NOT NULL DEFAULT '0', "obtainedScore" numeric(10,2) NOT NULL DEFAULT '0', "percentage" numeric(5,2) NOT NULL DEFAULT '0', "grade" character varying(10) NOT NULL, "selectedGrade" integer NOT NULL, "assessmentGradingRemarks" text NOT NULL, "overallComments" text NOT NULL, "warehouseOperatorApplicationId" uuid, "warehouseLocationId" uuid, "globalDocumentPath" text, "globalDocumentIv" text, "globalDocumentAuthTag" text, "globalDocumentMimeType" text, "globalDocumentOriginalName" text, "status" "public"."inspection_report_requests_status_enum" NOT NULL DEFAULT 'pending', "requestedBy" uuid, "reviewedBy" uuid, "reviewedAt" TIMESTAMP, "reviewNotes" text, "originalData" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dd45f2f5be611b7e66c940c7c6c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assessment_submission_requests" ADD CONSTRAINT "FK_3b3a6f9c9ad3ecebe3eb6877115" FOREIGN KEY ("inspectionReportRequestId") REFERENCES "inspection_report_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_submission_requests" DROP CONSTRAINT "FK_3b3a6f9c9ad3ecebe3eb6877115"`);
        await queryRunner.query(`DROP TABLE "inspection_report_requests"`);
        await queryRunner.query(`DROP TYPE "public"."inspection_report_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inspection_report_requests_assessmenttype_enum"`);
        await queryRunner.query(`DROP TABLE "assessment_submission_requests"`);
    }

}
