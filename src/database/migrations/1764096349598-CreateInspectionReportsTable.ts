import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInspectionReportsTable1764096349598 implements MigrationInterface {
    name = 'CreateInspectionReportsTable1764096349598'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inspection_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "maximumScore" character varying(50) NOT NULL, "obtainedScore" character varying(50) NOT NULL, "percentage" character varying(50) NOT NULL, "grade" character varying(10) NOT NULL, "selectedGrade" integer NOT NULL, "assessmentGradingRemarks" text NOT NULL, "overallComments" text NOT NULL, "warehouseOperatorApplicationId" uuid, "warehouseLocationId" uuid, "createdBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_661242697489523769401a1c299" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD "inspectionReportId" uuid`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD CONSTRAINT "FK_04d21d3dad71df6b44a0b270756" FOREIGN KEY ("warehouseOperatorApplicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD CONSTRAINT "FK_867ee6c2a036a4e44a16739fc2f" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" ADD CONSTRAINT "FK_8ca42259a2e70ce6bb8b120815b" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" ADD CONSTRAINT "FK_b457a744388150a4ef982c4c7c5" FOREIGN KEY ("inspectionReportId") REFERENCES "inspection_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP CONSTRAINT "FK_b457a744388150a4ef982c4c7c5"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP CONSTRAINT "FK_8ca42259a2e70ce6bb8b120815b"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP CONSTRAINT "FK_867ee6c2a036a4e44a16739fc2f"`);
        await queryRunner.query(`ALTER TABLE "inspection_reports" DROP CONSTRAINT "FK_04d21d3dad71df6b44a0b270756"`);
        await queryRunner.query(`ALTER TABLE "expert_assessment_submissions" DROP COLUMN "inspectionReportId"`);
        await queryRunner.query(`DROP TABLE "inspection_reports"`);
    }

}
