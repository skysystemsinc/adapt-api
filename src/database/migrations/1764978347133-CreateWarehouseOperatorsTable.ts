import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWarehouseOperatorsTable1764978347133 implements MigrationInterface {
    name = 'CreateWarehouseOperatorsTable1764978347133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operators_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TABLE "warehouse_operators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "applicationId" uuid, "status" "public"."warehouse_operators_status_enum" NOT NULL DEFAULT 'ACTIVE', "operatorCode" character varying(20), "approvedAt" date, "approvedBy" uuid, "approvedByFullName" character varying(255), "approvedByDesignation" character varying(255), "dateOfAssessment" date, "accreditationGrade" character varying(255), "expiryDate" date, "remarks" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4586c322a9e096c1282e4bdd93c" UNIQUE ("operatorCode"), CONSTRAINT "PK_de7c7dbee4e8f2881fde8d467d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouse_operators" ADD CONSTRAINT "FK_e56db3545ce5eacf4d1d6c21f3e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_operators" ADD CONSTRAINT "FK_8779dde2bfab91291b0817c43da" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "warehouse_operators" ADD CONSTRAINT "FK_93020c386eda8053effdce9a401" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_operators" DROP CONSTRAINT "FK_93020c386eda8053effdce9a401"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operators" DROP CONSTRAINT "FK_8779dde2bfab91291b0817c43da"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operators" DROP CONSTRAINT "FK_e56db3545ce5eacf4d1d6c21f3e"`);
        await queryRunner.query(`DROP TABLE "warehouse_operators"`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operators_status_enum"`);
    }

}
