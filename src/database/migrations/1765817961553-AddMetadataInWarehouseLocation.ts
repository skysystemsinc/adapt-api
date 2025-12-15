import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetadataInWarehouseLocation1765817961553 implements MigrationInterface {
    name = 'AddMetadataInWarehouseLocation1765817961553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_location" ADD "metadata" jsonb DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_location" DROP COLUMN "metadata"`);
    }

}
