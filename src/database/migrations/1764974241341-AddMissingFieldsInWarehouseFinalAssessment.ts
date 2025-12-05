import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingFieldsInWarehouseFinalAssessment1764974241341 implements MigrationInterface {
    name = 'AddMissingFieldsInWarehouseFinalAssessment1764974241341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD "fullName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD "designation" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD "dateOfAssessment" date`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD "accreditationGrade" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP COLUMN "accreditationGrade"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP COLUMN "dateOfAssessment"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP COLUMN "designation"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP COLUMN "fullName"`);
    }

}
