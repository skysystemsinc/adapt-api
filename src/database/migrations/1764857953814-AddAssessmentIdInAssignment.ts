import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssessmentIdInAssignment1764857953814 implements MigrationInterface {
    name = 'AddAssessmentIdInAssignment1764857953814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" ADD "assessmentId" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."assignment_level_enum" RENAME TO "assignment_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_level_enum" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD')`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "level" TYPE "public"."assignment_level_enum" USING "level"::"text"::"public"."assignment_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_level_enum_old"`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_40cd2019926cc0d086748436b5d" FOREIGN KEY ("assessmentId") REFERENCES "inspection_reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_40cd2019926cc0d086748436b5d"`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_level_enum_old" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT')`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "level" TYPE "public"."assignment_level_enum_old" USING "level"::"text"::"public"."assignment_level_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."assignment_level_enum_old" RENAME TO "assignment_level_enum"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "assessmentId"`);
    }

}
