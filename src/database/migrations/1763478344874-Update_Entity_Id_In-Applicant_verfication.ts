import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntityIdInApplicantVerfication1763478344874 implements MigrationInterface {
    name = 'UpdateEntityIdInApplicantVerfication1763478344874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "entityId"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "entityId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_0ea6e9de7a8efc14cbd7e8a187" ON "warehouse_applicant_verifications" ("id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0ea6e9de7a8efc14cbd7e8a187"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" DROP COLUMN "entityId"`);
        await queryRunner.query(`ALTER TABLE "warehouse_applicant_verifications" ADD "entityId" integer NOT NULL`);
    }

}
