import { MigrationInterface, QueryRunner } from "typeorm";
 
export class CreateAssessmentAndRelatedTables1764006224299 implements MigrationInterface {
    name = 'CreateAssessmentAndRelatedTables1764006224299'
 
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`CREATE TYPE "public"."expert_assessments_category_enum" AS ENUM('financial', 'hr', 'legal', 'security', 'technical', 'ecg')`);
        await queryRunner.query(`CREATE TYPE "public"."expert_assessment_submissions_status_enum" AS ENUM('pending', 'approved', 'rejected', 'under_review')`);
 
        // Create expert_assessments table
        await queryRunner.query(`CREATE TABLE "expert_assessments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "category" "public"."expert_assessments_category_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_expert_assessments" PRIMARY KEY ("id"))`);
 
        // Create expert_assessment_submissions table
        await queryRunner.query(`CREATE TABLE "expert_assessment_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" numeric(5,2), "remarks" text, "status" "public"."expert_assessment_submissions_status_enum" NOT NULL DEFAULT 'pending', "assessmentId" uuid NOT NULL, "warehouseOperatorApplicationId" uuid, "warehouseLocationId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_expert_assessment_submissions" PRIMARY KEY ("id"))`);
 
        // Create expert_assessment_documents table
        await queryRunner.query(`CREATE TABLE "expert_assessment_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submissionId" uuid NOT NULL, "fileName" character varying(255) NOT NULL, "filePath" character varying(500) NOT NULL, "fileType" character varying(100) NOT NULL, "fileSize" bigint NOT NULL, "documentType" character varying(100), "description" text, "uploadedBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_expert_assessment_documents" PRIMARY KEY ("id"))`);
 
        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "expert_assessments" ADD CONSTRAINT "FK_expert_assessments_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_expert_assessment_submissions_assessmentId" FOREIGN KEY ("assessmentId") REFERENCES "expert_assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_expert_assessment_submissions_warehouseOperatorApplicationId" FOREIGN KEY ("warehouseOperatorApplicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_expert_assessment_submissions_warehouseLocationId" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_expert_assessment_documents_submissionId" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_expert_assessment_documents_uploadedBy" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
 
    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_expert_assessment_documents_uploadedBy"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_expert_assessment_documents_submissionId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_expert_assessment_submissions_warehouseLocationId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_expert_assessment_submissions_warehouseOperatorApplicationId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_expert_assessment_submissions_assessmentId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessments" DROP CONSTRAINT "FK_expert_assessments_createdBy"`);
 
        // Drop tables
        await queryRunner.query(`DROP TABLE "expert_assessment_documents"`);
        await queryRunner.query(`DROP TABLE "expert_assessment_submissions"`);
        await queryRunner.query(`DROP TABLE "expert_assessments"`);
 
        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."expert_assessment_submissions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."expert_assessments_category_enum"`);
    }
 
}