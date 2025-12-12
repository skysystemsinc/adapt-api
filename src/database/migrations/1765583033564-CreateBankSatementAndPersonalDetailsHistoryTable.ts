import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBankSatementAndPersonalDetailsHistoryTable1765583033564 implements MigrationInterface {
    name = 'CreateBankSatementAndPersonalDetailsHistoryTable1765583033564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "company_information_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "companyInformationId" uuid NOT NULL, "companyName" character varying(200) NOT NULL, "secpRegistrationNumber" character varying(200) NOT NULL, "activeFilerStatus" boolean NOT NULL, "dateOfIncorporation" date NOT NULL, "businessCommencementDate" date, "registeredOfficeAddress" text NOT NULL, "postalCode" character varying(10), "nationalTaxNumber" character varying(100) NOT NULL, "salesTaxRegistrationNumber" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ntcCertificate" uuid, CONSTRAINT "PK_93d1df5f2174e8c9c6bb7094b67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bank_details_history_status_enum" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'RESUBMITTED')`);
        await queryRunner.query(`CREATE TABLE "bank_details_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "bankDetailsId" uuid NOT NULL, "name" character varying(200) NOT NULL, "accountTitle" character varying(200) NOT NULL, "iban" character varying(24) NOT NULL, "accountType" character varying(100), "branchAddress" character varying(200), "status" "public"."bank_details_history_status_enum" NOT NULL DEFAULT 'DRAFT', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6d8c803c740254a102fa120b3fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hr_personal_details_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "designationId" uuid, "personalDetailsId" uuid NOT NULL, "photograph" uuid, "name" character varying(100) NOT NULL, "fathersHusbandName" character varying(100) NOT NULL, "cnicPassport" character varying(13) NOT NULL, "nationality" character varying(100) NOT NULL, "dateOfBirth" date NOT NULL, "residentialAddress" text NOT NULL, "businessAddress" text, "telephone" character varying(100), "mobileNumber" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "nationalTaxNumber" character varying(100), "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fe6fede1b4954b359d187d554ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "company_information_history" ADD CONSTRAINT "FK_1157fe91c2964fbf6b018221601" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_information_history" ADD CONSTRAINT "FK_e988feeae61da52151b7b1ab9d7" FOREIGN KEY ("companyInformationId") REFERENCES "company_information"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_information_history" ADD CONSTRAINT "FK_9fa688065588157c9310e0309d1" FOREIGN KEY ("ntcCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_details_history" ADD CONSTRAINT "FK_b9389cdb5d09d3ad987197a4964" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_details_history" ADD CONSTRAINT "FK_e7762e3f70ad0d52ee7fdac05ab" FOREIGN KEY ("bankDetailsId") REFERENCES "bank_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details_history" ADD CONSTRAINT "FK_116753ddbe0e58c9003d0f7f99e" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details_history" ADD CONSTRAINT "FK_c8a520ed91d163f3ff26e2d4aa5" FOREIGN KEY ("personalDetailsId") REFERENCES "hr_personal_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details_history" ADD CONSTRAINT "FK_62a3c3068ca5813886a0c73f693" FOREIGN KEY ("photograph") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_personal_details_history" DROP CONSTRAINT "FK_62a3c3068ca5813886a0c73f693"`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details_history" DROP CONSTRAINT "FK_c8a520ed91d163f3ff26e2d4aa5"`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details_history" DROP CONSTRAINT "FK_116753ddbe0e58c9003d0f7f99e"`);
        await queryRunner.query(`ALTER TABLE "bank_details_history" DROP CONSTRAINT "FK_e7762e3f70ad0d52ee7fdac05ab"`);
        await queryRunner.query(`ALTER TABLE "bank_details_history" DROP CONSTRAINT "FK_b9389cdb5d09d3ad987197a4964"`);
        await queryRunner.query(`ALTER TABLE "company_information_history" DROP CONSTRAINT "FK_9fa688065588157c9310e0309d1"`);
        await queryRunner.query(`ALTER TABLE "company_information_history" DROP CONSTRAINT "FK_e988feeae61da52151b7b1ab9d7"`);
        await queryRunner.query(`ALTER TABLE "company_information_history" DROP CONSTRAINT "FK_1157fe91c2964fbf6b018221601"`);
        await queryRunner.query(`DROP TABLE "hr_personal_details_history"`);
        await queryRunner.query(`DROP TABLE "bank_details_history"`);
        await queryRunner.query(`DROP TYPE "public"."bank_details_history_status_enum"`);
        await queryRunner.query(`DROP TABLE "company_information_history"`);
    }

}
