import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProcessTypeInAssignment1766197986479 implements MigrationInterface {
    name = 'AddProcessTypeInAssignment1766197986479'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assignment_processtype_enum" AS ENUM('ACCREDITATION', 'UNLOCK')`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD "processType" "public"."assignment_processtype_enum" NOT NULL DEFAULT 'ACCREDITATION'`);
        await queryRunner.query(`CREATE INDEX "processType_index" ON "assignment" ("processType") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."processType_index"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "processType"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_processtype_enum"`);
    }

}
