import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEncryptionFieldsInWarehouseDocumentsTable1765801780692 implements MigrationInterface {
    name = 'AddEncryptionFieldsInWarehouseDocumentsTable1765801780692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_documents" ADD "iv" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "warehouse_documents" ADD "authTag" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_documents" DROP COLUMN "authTag"`);
        await queryRunner.query(`ALTER TABLE "warehouse_documents" DROP COLUMN "iv"`);
    }

}
