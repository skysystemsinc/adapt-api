import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApplicationTypeTable1759846976777 implements MigrationInterface {
    name = 'CreateApplicationTypeTable1759846976777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "application_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4dc086c7d5868bd0eeee0fd7190" UNIQUE ("name"), CONSTRAINT "UQ_2a6de215ca85b3dafcf45667c29" UNIQUE ("slug"), CONSTRAINT "PK_d0df6488786bebbf22e34194f73" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "application_type"`);
    }

}
