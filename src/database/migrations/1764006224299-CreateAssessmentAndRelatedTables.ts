import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssessmentAndRelatedTables1764006224299 implements MigrationInterface {
    name = 'CreateAssessmentAndRelatedTables1764006224299'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessments" DROP CONSTRAINT "UQ_ef30222af443fec7087aeafc32e"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expert_assessments" ADD CONSTRAINT "UQ_ef30222af443fec7087aeafc32e" UNIQUE ("name")`);
    }

}
