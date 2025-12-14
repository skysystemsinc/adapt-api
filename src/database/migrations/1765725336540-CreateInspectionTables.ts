import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInspectionTables1765725336540 implements MigrationInterface {
    name = 'CreateInspectionTables1765725336540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_b54e64b9732c089ed77301ba188"`);
        await queryRunner.query(`CREATE TYPE "public"."expert_assessment_submissions_history_status_enum" AS ENUM('pending', 'approved', 'rejected', 'under_review')`);
        await queryRunner.query(`CREATE TABLE "expert_assessment_submissions_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" numeric(5,2), "remarks" text, "status" "public"."expert_assessment_submissions_history_status_enum" NOT NULL DEFAULT 'pending', "assessmentId" uuid NOT NULL, "warehouseOperatorApplicationId" uuid, "warehouseLocationId" uuid, "inspectionReportHistoryId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_00d98224ab071924f2e6c63782e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."inspection_reports_history_assessmenttype_enum" AS ENUM('financial', 'hr', 'legal', 'security', 'technical', 'ecg')`);
        await queryRunner.query(`CREATE TYPE "public"."inspection_reports_history_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'UNDER_REVIEW', 'RESUBMITTED')`);
        await queryRunner.query(`CREATE TABLE "inspection_reports_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inspectionReportId" uuid NOT NULL, "assessmentType" "public"."inspection_reports_history_assessmenttype_enum" NOT NULL, "maximumScore" numeric(10,2) NOT NULL DEFAULT '0', "obtainedScore" numeric(10,2) NOT NULL DEFAULT '0', "percentage" numeric(5,2) NOT NULL DEFAULT '0', "grade" character varying(10) NOT NULL, "selectedGrade" integer NOT NULL, "assessmentGradingRemarks" text NOT NULL, "overallComments" text NOT NULL, "warehouseOperatorApplicationId" uuid, "warehouseLocationId" uuid, "remarks" text, "approvedBy" uuid, "approvedAt" TIMESTAMP, "createdBy" uuid, "status" "public"."inspection_reports_history_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_455e892c935c864d5c6cad12f0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD "submissionHistoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD "inspectionReportHistoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" ADD CONSTRAINT "FK_b2b669d23e64133964942009f27" FOREIGN KEY ("assessmentId") REFERENCES "expert_assessments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" ADD CONSTRAINT "FK_00113da1c6f3a7385e6a52ebc4f" FOREIGN KEY ("warehouseOperatorApplicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" ADD CONSTRAINT "FK_099dceeb0b14e14e772eebc2093" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" ADD CONSTRAINT "FK_c0b6f36072e6a575ce125c8e219" FOREIGN KEY ("inspectionReportHistoryId") REFERENCES "inspection_reports_history"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ADD CONSTRAINT "FK_1b647fecf09c8e4ea34591f38a3" FOREIGN KEY ("inspectionReportId") REFERENCES "inspection_reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ADD CONSTRAINT "FK_6507dedc3e0afaceefead266e12" FOREIGN KEY ("warehouseOperatorApplicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ADD CONSTRAINT "FK_c5d8073420c8cc92c855006e96d" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ADD CONSTRAINT "FK_13264c7f9c23577672e10f13969" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" ADD CONSTRAINT "FK_04f18b9b285c8df268295f892b0" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_bf36dbb287c97dc9e7500716958" FOREIGN KEY ("submissionHistoryId") REFERENCES "expert_assessment_submissions_history"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_b54e64b9732c089ed77301ba188" FOREIGN KEY ("inspectionReportId") REFERENCES "inspection_reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_0c9b9928cfbd7db5ceb77ca9c29" FOREIGN KEY ("inspectionReportHistoryId") REFERENCES "inspection_reports_history"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_0c9b9928cfbd7db5ceb77ca9c29"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_b54e64b9732c089ed77301ba188"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_bf36dbb287c97dc9e7500716958"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" DROP CONSTRAINT "FK_04f18b9b285c8df268295f892b0"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" DROP CONSTRAINT "FK_13264c7f9c23577672e10f13969"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" DROP CONSTRAINT "FK_c5d8073420c8cc92c855006e96d"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" DROP CONSTRAINT "FK_6507dedc3e0afaceefead266e12"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports_history" DROP CONSTRAINT "FK_1b647fecf09c8e4ea34591f38a3"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" DROP CONSTRAINT "FK_c0b6f36072e6a575ce125c8e219"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" DROP CONSTRAINT "FK_099dceeb0b14e14e772eebc2093"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" DROP CONSTRAINT "FK_00113da1c6f3a7385e6a52ebc4f"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions_history" DROP CONSTRAINT "FK_b2b669d23e64133964942009f27"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP COLUMN "inspectionReportHistoryId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP COLUMN "submissionHistoryId"`);
        await queryRunner.query(`DROP TABLE "inspection_reports_history"`);
        await queryRunner.query(`DROP TYPE "public"."inspection_reports_history_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inspection_reports_history_assessmenttype_enum"`);
        await queryRunner.query(`DROP TABLE "expert_assessment_submissions_history"`);
        await queryRunner.query(`DROP TYPE "public"."expert_assessment_submissions_history_status_enum"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_b54e64b9732c089ed77301ba188" FOREIGN KEY ("inspectionReportId") REFERENCES "inspection_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
