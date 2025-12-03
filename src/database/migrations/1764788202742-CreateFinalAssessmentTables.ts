import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFinalAssessmentTables1764788202742 implements MigrationInterface {
    name = 'CreateFinalAssessmentTables1764788202742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."warehouse_final_assessment_details_decision_enum" AS ENUM('RECONSIDERATION', 'ACCEPTED', 'PENDING', 'REJECTED', 'CONDITIONAL_ACCEPTED', 'NEED_IMPROVEMENT', 'DOWN_RATE', 'UP_RATE')`);
        await queryRunner.query(`CREATE TABLE "warehouse_final_assessment_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assessmentId" uuid, "submissionId" uuid, "type" character varying(100), "decision" "public"."warehouse_final_assessment_details_decision_enum", "remarks" text, "score" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP, "updatedAt" TIMESTAMP, CONSTRAINT "PK_cbb123fb4f6f2cc6fe87e79f8a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "warehouse_final_assessment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "applicationLocationId" uuid, "userId" uuid NOT NULL, "isSubmitted" boolean NOT NULL DEFAULT false, "submittedAt" TIMESTAMP, "createdAt" TIMESTAMP, "updatedAt" TIMESTAMP, CONSTRAINT "PK_b8f46c4ffa342f5df53f38cc721" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment_details" ADD CONSTRAINT "FK_921e01be984c4f1f6f310595756" FOREIGN KEY ("assessmentId") REFERENCES "warehouse_final_assessment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment_details" ADD CONSTRAINT "FK_1401f37b4d2379dbbe63bca23c8" FOREIGN KEY ("submissionId") REFERENCES "expert_assessment_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD CONSTRAINT "FK_e54b1c41a19a10673b7462688e2" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD CONSTRAINT "FK_93100043141a6865c037d64c48e" FOREIGN KEY ("applicationLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD CONSTRAINT "FK_d212c6d02cc143dfc61c42a675c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP CONSTRAINT "FK_d212c6d02cc143dfc61c42a675c"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP CONSTRAINT "FK_93100043141a6865c037d64c48e"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP CONSTRAINT "FK_e54b1c41a19a10673b7462688e2"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment_details" DROP CONSTRAINT "FK_1401f37b4d2379dbbe63bca23c8"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment_details" DROP CONSTRAINT "FK_921e01be984c4f1f6f310595756"`);
        await queryRunner.query(`DROP TABLE "warehouse_final_assessment"`);
        await queryRunner.query(`DROP TABLE "warehouse_final_assessment_details"`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_final_assessment_details_decision_enum"`);
    }

}
