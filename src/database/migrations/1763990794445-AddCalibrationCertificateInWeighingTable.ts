import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalibrationCertificateInWeighingTable1763990794445 implements MigrationInterface {
    name = 'AddCalibrationCertificateInWeighingTable1763990794445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "weighbridgeCalibrationCertificate"`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "weighbridgeCalibrationCertificate" uuid`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD CONSTRAINT "FK_13a63fa820e4c89688c8795a4ab" FOREIGN KEY ("weighbridgeCalibrationCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing" DROP CONSTRAINT "FK_13a63fa820e4c89688c8795a4ab"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "weighbridgeCalibrationCertificate"`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "weighbridgeCalibrationCertificate" character varying(500)`);
    }

}
