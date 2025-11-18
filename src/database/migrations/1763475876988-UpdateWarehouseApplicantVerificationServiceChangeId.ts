import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWarehouseApplicantVerificationServiceChangeId1763475876988 implements MigrationInterface {
    name = 'UpdateWarehouseApplicantVerificationServiceChangeId1763475876988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP CONSTRAINT "PK_0ea6e9de7a8efc14cbd7e8a187d"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD CONSTRAINT "PK_0ea6e9de7a8efc14cbd7e8a187d" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP CONSTRAINT "PK_0ea6e9de7a8efc14cbd7e8a187d"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD CONSTRAINT "PK_0ea6e9de7a8efc14cbd7e8a187d" PRIMARY KEY ("id")`);
    }

}
