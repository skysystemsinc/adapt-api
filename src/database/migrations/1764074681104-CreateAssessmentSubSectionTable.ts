import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssessmentSubSectionTable1764074681104 implements MigrationInterface {
    name = 'CreateAssessmentSubSectionTable1764074681104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assessment_sub_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assessmentId" uuid NOT NULL, "name" character varying(255) NOT NULL, "order" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9fcf973ebfa717f823c12e7f94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assessment_sub_sections" ADD CONSTRAINT "FK_92d4a6182be802fc6f77debe72c" FOREIGN KEY ("assessmentId") REFERENCES "expert_assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessment_sub_sections" DROP CONSTRAINT "FK_92d4a6182be802fc6f77debe72c"`);
        await queryRunner.query(`DROP TABLE "assessment_sub_sections"`);
    }

}
