import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFinancialsTable1765588914663 implements MigrationInterface {
    name = 'CreateFinancialsTable1765588914663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "financial_information_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "financialInformationId" uuid NOT NULL, "applicationId" uuid, "auditReportId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_68379be0d79f233dfde95a82c9" UNIQUE ("auditReportId"), CONSTRAINT "PK_a5d3bfecd081fe349f84fcef6a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tax_return_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taxReturnId" uuid NOT NULL, "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "remarks" character varying(200), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "document" uuid, CONSTRAINT "PK_a70fbc1f2f3141297e48f084dbc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "others_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "othersId" uuid NOT NULL, "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "remarks" character varying(200), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "document" uuid, CONSTRAINT "PK_0c0a11cb2acfde01a332f7eefc2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_report_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auditReportId" uuid NOT NULL, "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "assets" character varying(100) NOT NULL, "liabilities" character varying(100) NOT NULL, "equity" character varying(100) NOT NULL, "revenue" character varying(100) NOT NULL, "netProfitLoss" character varying(100) NOT NULL, "remarks" character varying(100), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "document" uuid, CONSTRAINT "PK_aae1902a62551fef1789b4f0e88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bank_statement_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bankStatementId" uuid NOT NULL, "documentType" character varying(100) NOT NULL, "documentName" character varying(100) NOT NULL, "periodStart" character varying(100) NOT NULL, "periodEnd" character varying(100) NOT NULL, "remarks" character varying(200), "financialInformationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "document" uuid, CONSTRAINT "PK_3dc57fa157fd614c54abe917d49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "financial_information_history" ADD CONSTRAINT "FK_a4d4daf98798176517d6818bb14" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_information_history" ADD CONSTRAINT "FK_83a0f25abada314317554f8acd5" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_information_history" ADD CONSTRAINT "FK_68379be0d79f233dfde95a82c97" FOREIGN KEY ("auditReportId") REFERENCES "audit_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_return_history" ADD CONSTRAINT "FK_40d148e88aaee8cd4c241ba6c2d" FOREIGN KEY ("taxReturnId") REFERENCES "tax_return"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_return_history" ADD CONSTRAINT "FK_1bb2397c05ef3928db4002b4cfb" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_return_history" ADD CONSTRAINT "FK_9ff3646f5e2a7a042a840013564" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "others_history" ADD CONSTRAINT "FK_09e633d8d3e38c04a4da1bedf5a" FOREIGN KEY ("othersId") REFERENCES "financial_others"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "others_history" ADD CONSTRAINT "FK_4ffdd5af9ce17b9796474da4cfc" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "others_history" ADD CONSTRAINT "FK_67d5c12ab341e37fc279294c2b0" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_report_history" ADD CONSTRAINT "FK_6faf65be0180cb161e2838d2541" FOREIGN KEY ("auditReportId") REFERENCES "audit_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_report_history" ADD CONSTRAINT "FK_8365d28265db2b50b1495c37d65" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_report_history" ADD CONSTRAINT "FK_a8a8b6e7925ff23c9a7971f45ef" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_statement_history" ADD CONSTRAINT "FK_06f57d88aadb10617ca12733f06" FOREIGN KEY ("bankStatementId") REFERENCES "bank_statement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_statement_history" ADD CONSTRAINT "FK_f1045b2a29a563802f0710f9a67" FOREIGN KEY ("financialInformationId") REFERENCES "financial_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_statement_history" ADD CONSTRAINT "FK_1dfdef429c3289bfabc58ab5600" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bank_statement_history" DROP CONSTRAINT "FK_1dfdef429c3289bfabc58ab5600"`);
        await queryRunner.query(`ALTER TABLE "bank_statement_history" DROP CONSTRAINT "FK_f1045b2a29a563802f0710f9a67"`);
        await queryRunner.query(`ALTER TABLE "bank_statement_history" DROP CONSTRAINT "FK_06f57d88aadb10617ca12733f06"`);
        await queryRunner.query(`ALTER TABLE "audit_report_history" DROP CONSTRAINT "FK_a8a8b6e7925ff23c9a7971f45ef"`);
        await queryRunner.query(`ALTER TABLE "audit_report_history" DROP CONSTRAINT "FK_8365d28265db2b50b1495c37d65"`);
        await queryRunner.query(`ALTER TABLE "audit_report_history" DROP CONSTRAINT "FK_6faf65be0180cb161e2838d2541"`);
        await queryRunner.query(`ALTER TABLE "others_history" DROP CONSTRAINT "FK_67d5c12ab341e37fc279294c2b0"`);
        await queryRunner.query(`ALTER TABLE "others_history" DROP CONSTRAINT "FK_4ffdd5af9ce17b9796474da4cfc"`);
        await queryRunner.query(`ALTER TABLE "others_history" DROP CONSTRAINT "FK_09e633d8d3e38c04a4da1bedf5a"`);
        await queryRunner.query(`ALTER TABLE "tax_return_history" DROP CONSTRAINT "FK_9ff3646f5e2a7a042a840013564"`);
        await queryRunner.query(`ALTER TABLE "tax_return_history" DROP CONSTRAINT "FK_1bb2397c05ef3928db4002b4cfb"`);
        await queryRunner.query(`ALTER TABLE "tax_return_history" DROP CONSTRAINT "FK_40d148e88aaee8cd4c241ba6c2d"`);
        await queryRunner.query(`ALTER TABLE "financial_information_history" DROP CONSTRAINT "FK_68379be0d79f233dfde95a82c97"`);
        await queryRunner.query(`ALTER TABLE "financial_information_history" DROP CONSTRAINT "FK_83a0f25abada314317554f8acd5"`);
        await queryRunner.query(`ALTER TABLE "financial_information_history" DROP CONSTRAINT "FK_a4d4daf98798176517d6818bb14"`);
        await queryRunner.query(`DROP TABLE "bank_statement_history"`);
        await queryRunner.query(`DROP TABLE "audit_report_history"`);
        await queryRunner.query(`DROP TABLE "others_history"`);
        await queryRunner.query(`DROP TABLE "tax_return_history"`);
        await queryRunner.query(`DROP TABLE "financial_information_history"`);
    }

}
