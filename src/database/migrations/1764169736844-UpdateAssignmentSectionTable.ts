import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAssignmentSectionTable1764169736844 implements MigrationInterface {
    name = 'UpdateAssignmentSectionTable1764169736844'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessments" DROP CONSTRAINT "FK_expert_assessments_createdBy"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_expert_assessment_documents_submissionId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_expert_assessment_documents_uploadedBy"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_expert_assessment_submissions_assessmentId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_expert_assessment_submissions_warehouseOperatorApplicationId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_expert_assessment_submissions_warehouseLocationId"`);
        await queryRunner.query(`ALTER TABLE "assignment_sections" ADD "resourceId" uuid`);
        await queryRunner.query(`ALTER TABLE "assignment_sections" ADD "resourceType" character varying`);
        await queryRunner.query(`ALTER TABLE "expert_assessments" ADD CONSTRAINT "FK_740e3d400bc274c42f1b318bf54" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_b18746f30ef88bc7a5aab6b0b61" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_31e614038409bf6bad2ce67a266" FOREIGN KEY ("assessmentId") REFERENCES "expert_assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_5c7f1e2fcb88ec5cb51ecddfa0d" FOREIGN KEY ("warehouseOperatorApplicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_8cfbd15f6f43377c3d0dffd93b6" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_8cfbd15f6f43377c3d0dffd93b6"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_5c7f1e2fcb88ec5cb51ecddfa0d"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_31e614038409bf6bad2ce67a266"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_b18746f30ef88bc7a5aab6b0b61"`);
        await queryRunner.query(`ALTER TABLE "expert_assessments" DROP CONSTRAINT "FK_740e3d400bc274c42f1b318bf54"`);
        await queryRunner.query(`ALTER TABLE "assignment_sections" DROP COLUMN "resourceType"`);
        await queryRunner.query(`ALTER TABLE "assignment_sections" DROP COLUMN "resourceId"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_expert_assessment_submissions_warehouseLocationId" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_expert_assessment_submissions_warehouseOperatorApplicationId" FOREIGN KEY ("warehouseOperatorApplicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_expert_assessment_submissions_assessmentId" FOREIGN KEY ("assessmentId") REFERENCES "expert_assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_expert_assessment_documents_uploadedBy" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_expert_assessment_documents_submissionId" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessments" ADD CONSTRAINT "FK_expert_assessments_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
