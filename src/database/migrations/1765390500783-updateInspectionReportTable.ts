import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateInspectionReportTable1765390500783 implements MigrationInterface {
    name = 'UpdateInspectionReportTable1765390500783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "application_rejection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "locationApplicationId" uuid, "rejectionReason" character varying, "rejectionBy" uuid, "unlockedSections" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_abcf98114eb252f6ad68ab4cbd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD "inspectionReportId" uuid`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ALTER COLUMN "submissionId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_b54e64b9732c089ed77301ba188" FOREIGN KEY ("inspectionReportId") REFERENCES "inspection_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_b54e64b9732c089ed77301ba188"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ALTER COLUMN "submissionId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" ADD CONSTRAINT "FK_f707d2f25064cb4ba46a3ad77da" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_documents" DROP COLUMN "inspectionReportId"`);
        await queryRunner.query(`DROP TABLE "application_rejection"`);
    }

}
