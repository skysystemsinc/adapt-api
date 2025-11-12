import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFinancialInformationTable1762883259015 implements MigrationInterface {
    name = 'CreateFinancialInformationTable1762883259015'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "assets" character varying(100) NOT NULL, "liabilities" character varying(100) NOT NULL, "equity" character varying(100) NOT NULL, "revenue" character varying(100) NOT NULL, "netProfitLoss" character varying(100) NOT NULL, "remarks" character varying(100), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_527e86de35710ed91fd60d49261" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tax_return" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "remarks" character varying(200), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e5b452cc32ae03ba97b4823fc4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bank_statement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "remarks" character varying(200), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a2f8f739ec54fbcb8600ced0816" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "financial_others" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "remarks" character varying(200), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1b6409c52d951e22606b52498d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "financial_information" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "auditReportId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_4bd2309f0297e385a92d788278" UNIQUE ("auditReportId"), CONSTRAINT "PK_e87cf4d2b3c88b6d7dd3eec12ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "audit_report" ADD CONSTRAINT "FK_f77fc1787dbe3a39ddae4715efd" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_return" ADD CONSTRAINT "FK_2dee7e6d83ea78c3054f2295f77" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_statement" ADD CONSTRAINT "FK_730bd898ebb2df55108bdf9a9e7" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_others" ADD CONSTRAINT "FK_d38989d3adcc6db9c6f4b61ae88" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_information" ADD CONSTRAINT "FK_0034102d045b01711da8a0adb4e" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_information" ADD CONSTRAINT "FK_4bd2309f0297e385a92d788278a" FOREIGN KEY ("auditReportId") REFERENCES "audit_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "financial_information" DROP CONSTRAINT "FK_4bd2309f0297e385a92d788278a"`);
        await queryRunner.query(`ALTER TABLE "financial_information" DROP CONSTRAINT "FK_0034102d045b01711da8a0adb4e"`);
        await queryRunner.query(`ALTER TABLE "financial_others" DROP CONSTRAINT "FK_d38989d3adcc6db9c6f4b61ae88"`);
        await queryRunner.query(`ALTER TABLE "bank_statement" DROP CONSTRAINT "FK_730bd898ebb2df55108bdf9a9e7"`);
        await queryRunner.query(`ALTER TABLE "tax_return" DROP CONSTRAINT "FK_2dee7e6d83ea78c3054f2295f77"`);
        await queryRunner.query(`ALTER TABLE "audit_report" DROP CONSTRAINT "FK_f77fc1787dbe3a39ddae4715efd"`);
        await queryRunner.query(`DROP TABLE "financial_information"`);
        await queryRunner.query(`DROP TABLE "financial_others"`);
        await queryRunner.query(`DROP TABLE "bank_statement"`);
        await queryRunner.query(`DROP TABLE "tax_return"`);
        await queryRunner.query(`DROP TABLE "audit_report"`);
    }

}
