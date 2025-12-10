import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDynamicTable1765385539740 implements MigrationInterface {
    name = 'CreateDynamicTable1765385539740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dynamic_calculator" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouseType" character varying NOT NULL, "warehouseCategory" character varying NOT NULL, "province" character varying NOT NULL, "accreditationFee" numeric(10,2) NOT NULL, "salesTaxSettingId" uuid, "salesTaxValue" numeric(10,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_72963d6e8169280c459beaa7dbc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "dynamic_calculator" ADD CONSTRAINT "FK_9e559d4da6d2bd604acd0575044" FOREIGN KEY ("salesTaxSettingId") REFERENCES "settings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dynamic_calculator" DROP CONSTRAINT "FK_9e559d4da6d2bd604acd0575044"`);
        await queryRunner.query(`DROP TABLE "dynamic_calculator"`);
    }

}
