import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingFieldsInRejectionTable1765455518671 implements MigrationInterface {
    name = 'AddMissingFieldsInRejectionTable1765455518671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."assignment_level_enum" RENAME TO "assignment_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_level_enum" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD', 'HOD_TO_APPLICANT')`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "level" TYPE "public"."assignment_level_enum" USING "level"::"text"::"public"."assignment_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_level_enum_old"`);
        await queryRunner.query(`ALTER TABLE "application_rejection" ADD CONSTRAINT "FK_4c45e8fdc67e392656134f3bf41" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_rejection" ADD CONSTRAINT "FK_593f37d9ce91b695c9e8b790037" FOREIGN KEY ("locationApplicationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_rejection" ADD CONSTRAINT "FK_c67e9e3b149209f9e8700eb7976" FOREIGN KEY ("rejectionBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_rejection" DROP CONSTRAINT "FK_c67e9e3b149209f9e8700eb7976"`);
        await queryRunner.query(`ALTER TABLE "application_rejection" DROP CONSTRAINT "FK_593f37d9ce91b695c9e8b790037"`);
        await queryRunner.query(`ALTER TABLE "application_rejection" DROP CONSTRAINT "FK_4c45e8fdc67e392656134f3bf41"`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_level_enum_old" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD')`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "level" TYPE "public"."assignment_level_enum_old" USING "level"::"text"::"public"."assignment_level_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."assignment_level_enum_old" RENAME TO "assignment_level_enum"`);
    }

}
