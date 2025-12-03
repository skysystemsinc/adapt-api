import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeInWarehouseFinalAssessmentTable1764800042087 implements MigrationInterface {
    name = 'AddTypeInWarehouseFinalAssessmentTable1764800042087'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD "type" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP COLUMN "type"`);
    }

}
