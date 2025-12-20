import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssignmentLevelTypeInAssignment1766199560953 implements MigrationInterface {
    name = 'AddAssignmentLevelTypeInAssignment1766199560953'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."assignment_level_enum" RENAME TO "assignment_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_level_enum" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD', 'HOD_TO_APPLICANT', 'ADMIN_TO_APPLICANT')`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "level" TYPE "public"."assignment_level_enum" USING "level"::"text"::"public"."assignment_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_level_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."assignment_history_level_enum" RENAME TO "assignment_history_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_history_level_enum" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD', 'HOD_TO_APPLICANT', 'ADMIN_TO_APPLICANT')`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ALTER COLUMN "level" TYPE "public"."assignment_history_level_enum" USING "level"::"text"::"public"."assignment_history_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_history_level_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assignment_history_level_enum_old" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD', 'HOD_TO_APPLICANT')`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ALTER COLUMN "level" TYPE "public"."assignment_history_level_enum_old" USING "level"::"text"::"public"."assignment_history_level_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_history_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."assignment_history_level_enum_old" RENAME TO "assignment_history_level_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_level_enum_old" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD', 'HOD_TO_APPLICANT')`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "level" TYPE "public"."assignment_level_enum_old" USING "level"::"text"::"public"."assignment_level_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."assignment_level_enum_old" RENAME TO "assignment_level_enum"`);
    }

}
