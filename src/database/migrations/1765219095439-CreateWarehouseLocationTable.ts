import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWarehouseLocationTable1765219095439 implements MigrationInterface {
    name = 'CreateWarehouseLocationTable1765219095439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operator_locations_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "warehouse_operator_locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "warehouseOperatorId" uuid, "warehouseLocationId" uuid, "status" "public"."warehouse_operator_locations_status_enum" NOT NULL DEFAULT 'ACTIVE', "locationCode" character varying(20), "approvedAt" date, "approvedBy" uuid, "approvedByFullName" character varying(255), "approvedByDesignation" character varying(255), "dateOfAssessment" date, "accreditationGrade" character varying(255), "expiryDate" date, "remarks" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b7fe82f6cd1c991d5de765eaf0f" UNIQUE ("locationCode"), CONSTRAINT "PK_b0e8225ce201c3d4b7878a6f1ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" ADD CONSTRAINT "FK_a1e685e7a59b9b520dbcfa30b80" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" ADD CONSTRAINT "FK_73ce879b444d301083db9fe8aa7" FOREIGN KEY ("warehouseOperatorId") REFERENCES "warehouse_operators"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" ADD CONSTRAINT "FK_7b17cbda9d7c39e632bddf67ac6" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" ADD CONSTRAINT "FK_805628693f19e61117280a22c8f" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" DROP CONSTRAINT "FK_805628693f19e61117280a22c8f"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" DROP CONSTRAINT "FK_7b17cbda9d7c39e632bddf67ac6"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" DROP CONSTRAINT "FK_73ce879b444d301083db9fe8aa7"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_locations" DROP CONSTRAINT "FK_a1e685e7a59b9b520dbcfa30b80"`);
        await queryRunner.query(`DROP TABLE "warehouse_operator_locations"`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_locations_status_enum"`);
    }

}
