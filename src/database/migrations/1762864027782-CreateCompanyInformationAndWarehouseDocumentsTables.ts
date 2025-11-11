import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompanyInformationAndWarehouseDocumentsTables1762864027782 implements MigrationInterface {
    name = 'CreateCompanyInformationAndWarehouseDocumentsTables1762864027782'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "warehouse_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "documentableType" character varying(100) NOT NULL, "documentableId" uuid NOT NULL, "documentType" character varying(100) NOT NULL, "originalFileName" character varying(255) NOT NULL, "filePath" text NOT NULL, "mimeType" character varying(100), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7c7eb51b2053de02c3afaa64484" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a6030cc85586c974efa72d273f" ON "warehouse_documents" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b768d30c1952185c7ca0979960" ON "warehouse_documents" ("documentableType", "documentableId") `);
        await queryRunner.query(`CREATE TABLE "company_information" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "companyName" character varying(200) NOT NULL, "secpRegistrationNumber" character varying(200) NOT NULL, "activeFilerStatus" boolean NOT NULL, "dateOfIncorporation" date NOT NULL, "businessCommencementDate" date, "registeredOfficeAddress" text NOT NULL, "postalCode" character varying(10), "nationalTaxNumber" character varying(100) NOT NULL, "salesTaxRegistrationNumber" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac715e6016ab035fa3b0611a4da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouse_documents" ADD CONSTRAINT "FK_a6030cc85586c974efa72d273fc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_information" ADD CONSTRAINT "FK_8c6cb8f888d3df08e00b929fce8" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_information" DROP CONSTRAINT "FK_8c6cb8f888d3df08e00b929fce8"`);
        await queryRunner.query(`ALTER TABLE "warehouse_documents" DROP CONSTRAINT "FK_a6030cc85586c974efa72d273fc"`);
        await queryRunner.query(`DROP TABLE "company_information"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b768d30c1952185c7ca0979960"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6030cc85586c974efa72d273f"`);
        await queryRunner.query(`DROP TABLE "warehouse_documents"`);
    }

}
