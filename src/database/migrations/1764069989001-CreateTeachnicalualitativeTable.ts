import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTeachnicalualitativeTable1764069989001 implements MigrationInterface {
    name = 'CreateTeachnicalualitativeTable1764069989001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "technical_qualitative" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouseLocationId" uuid NOT NULL, "laboratoryFacility" boolean NOT NULL DEFAULT false, "minimumLabEquipmentExist" boolean NOT NULL DEFAULT false, "equipmentCalibrated" boolean NOT NULL DEFAULT false, "washroomsExist" boolean NOT NULL DEFAULT false, "waterAvailability" boolean NOT NULL DEFAULT false, "officeInternetFacility" boolean NOT NULL DEFAULT false, "electricityAvailable" boolean NOT NULL DEFAULT false, "gasAvailable" boolean NOT NULL DEFAULT false, "generatorAvailable" boolean NOT NULL DEFAULT false, "otherUtilitiesFacilities" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_9cf5d31f3051a1c1ab9ee39c7e" UNIQUE ("warehouseLocationId"), CONSTRAINT "PK_30ac5c8535622ef7a0cd2277840" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "officeInternetFacility"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "gasAvailable"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "minimumLabEquipmentExist"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "waterAvailability"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "washroomsExist"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "electricityAvailable"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "laboratoryFacility"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "generatorAvailable"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "otherUtilitiesFacilities"`);
        await queryRunner.query(`ALTER TABLE "weighing" DROP COLUMN "equipmentCalibrated"`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ADD "technicalQualitativeId" uuid`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ADD CONSTRAINT "UQ_686b412d6006892a65d74e9b0fc" UNIQUE ("technicalQualitativeId")`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative" ADD CONSTRAINT "FK_9cf5d31f3051a1c1ab9ee39c7e0" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ADD CONSTRAINT "FK_686b412d6006892a65d74e9b0fc" FOREIGN KEY ("technicalQualitativeId") REFERENCES "technical_qualitative"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_location" DROP CONSTRAINT "FK_686b412d6006892a65d74e9b0fc"`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative" DROP CONSTRAINT "FK_9cf5d31f3051a1c1ab9ee39c7e0"`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" DROP CONSTRAINT "UQ_686b412d6006892a65d74e9b0fc"`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" DROP COLUMN "technicalQualitativeId"`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "equipmentCalibrated" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "otherUtilitiesFacilities" text`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "generatorAvailable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "laboratoryFacility" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "electricityAvailable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "washroomsExist" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "waterAvailability" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "minimumLabEquipmentExist" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "gasAvailable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weighing" ADD "officeInternetFacility" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "technical_qualitative"`);
    }

}
