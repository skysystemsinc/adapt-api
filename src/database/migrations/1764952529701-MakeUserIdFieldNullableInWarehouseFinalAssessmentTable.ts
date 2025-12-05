import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeUserIdFieldNullableInWarehouseFinalAssessmentTable1764952529701 implements MigrationInterface {
    name = 'MakeUserIdFieldNullableInWarehouseFinalAssessmentTable1764952529701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP CONSTRAINT "FK_d212c6d02cc143dfc61c42a675c"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD CONSTRAINT "FK_d212c6d02cc143dfc61c42a675c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" DROP CONSTRAINT "FK_d212c6d02cc143dfc61c42a675c"`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "warehouse_final_assessment" ADD CONSTRAINT "FK_d212c6d02cc143dfc61c42a675c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
