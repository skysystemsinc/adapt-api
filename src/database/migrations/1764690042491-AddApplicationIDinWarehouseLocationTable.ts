import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApplicationIDinWarehouseLocationTable1764690042491 implements MigrationInterface {
    name = 'AddApplicationIDinWarehouseLocationTable1764690042491'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add column as nullable first
        await queryRunner.query(`ALTER TABLE "warehouse_location" ADD "applicationId" character varying`);
        
        // Step 2: Generate unique application IDs for existing rows using CTE
        await queryRunner.query(`
            UPDATE "warehouse_location" AS wl
            SET "applicationId" = numbered.new_id
            FROM (
                SELECT id, 'WHL-' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt")::text, 6, '0') AS new_id
                FROM "warehouse_location"
                WHERE "applicationId" IS NULL
            ) AS numbered
            WHERE wl.id = numbered.id
        `);
        
        // Step 3: Make the column NOT NULL
        await queryRunner.query(`ALTER TABLE "warehouse_location" ALTER COLUMN "applicationId" SET NOT NULL`);
        
        // Step 4: Add unique constraint
        await queryRunner.query(`ALTER TABLE "warehouse_location" ADD CONSTRAINT "UQ_0e85806d20f379c7dc5e84611fe" UNIQUE ("applicationId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_location" DROP CONSTRAINT "UQ_0e85806d20f379c7dc5e84611fe"`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" DROP COLUMN "applicationId"`);
    }

}
