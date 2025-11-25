import { MigrationInterface, QueryRunner } from "typeorm";

export class HumanResourceAndDeclarationForWarehouseLocation1764002537976 implements MigrationInterface {
    name = 'HumanResourceAndDeclarationForWarehouseLocation1764002537976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_declarations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "humanResourceId" uuid NOT NULL, "writeOffAvailed" boolean NOT NULL DEFAULT false, "defaultOfFinance" boolean NOT NULL DEFAULT false, "placementOnECL" boolean NOT NULL DEFAULT false, "convictionOrPleaBargain" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9f9596405c4f479002fd171dcf4" UNIQUE ("humanResourceId"), CONSTRAINT "REL_9f9596405c4f479002fd171dcf" UNIQUE ("humanResourceId"), CONSTRAINT "PK_dc21a4a2844107a7df6b136f0a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hr_declarations" ADD CONSTRAINT "FK_9f9596405c4f479002fd171dcf4" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_declarations" DROP CONSTRAINT "FK_9f9596405c4f479002fd171dcf4"`);
        await queryRunner.query(`DROP TABLE "hr_declarations"`);
    }

}
