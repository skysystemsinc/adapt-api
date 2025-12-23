import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeHistoryTableForHumanResourceTable1766518732957 implements MigrationInterface {
    name = 'MakeHistoryTableForHumanResourceTable1766518732957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "human_resources_general_info_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "humanResourceId" uuid NOT NULL, "fullName" character varying(200) NOT NULL, "fathersHusbandsName" character varying(200) NOT NULL, "cnicPassport" character varying(50) NOT NULL, "nationality" character varying(100) NOT NULL, "dateOfBirth" date, "residentialAddress" text NOT NULL, "businessAddress" text NOT NULL, "telephoneNumber" character varying(50) NOT NULL, "mobileNumber" character varying(50) NOT NULL, "email" character varying(200) NOT NULL, "hrNationalTaxNumber" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "photograph" uuid, CONSTRAINT "PK_9108cd4d832d95ea6ee5d3dd850" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trainings_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "trainingId" uuid NOT NULL, "humanResourceId" uuid NOT NULL, "trainingTitle" character varying(200) NOT NULL, "conductedBy" character varying(200) NOT NULL, "trainingType" character varying(100) NOT NULL, "duration" character varying(50) NOT NULL, "dateOfCompletion" date, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "trainingCertificate" uuid, CONSTRAINT "PK_19fc062a1231c1d957452ccbbf2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "professional_qualifications_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "professionalQualificationId" uuid NOT NULL, "humanResourceId" uuid NOT NULL, "certificationTitle" character varying(200) NOT NULL, "issuingBody" character varying(200) NOT NULL, "country" character varying(100) NOT NULL, "dateOfAward" date, "membershipNumber" character varying(100) NOT NULL, "hasExpiryDate" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "professionalCertificate" uuid, CONSTRAINT "PK_65390819d9584527df5f7fa45d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "professional_experiences_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "professionalExperienceId" uuid NOT NULL, "humanResourceId" uuid NOT NULL, "positionHeld" character varying(200) NOT NULL, "organizationName" character varying(300) NOT NULL, "organizationAddress" text NOT NULL, "natureOfOrganization" character varying(200) NOT NULL, "dateOfAppointment" date, "dateOfLeaving" date, "duration" character varying(50) NOT NULL, "responsibilities" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "experienceLetter" uuid, CONSTRAINT "PK_2df50090e5e3cd11d0839c768c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hr_declarations_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "declarationId" uuid NOT NULL, "humanResourceId" uuid NOT NULL, "writeOffAvailed" boolean NOT NULL DEFAULT false, "defaultOfFinance" boolean NOT NULL DEFAULT false, "placementOnECL" boolean NOT NULL DEFAULT false, "convictionOrPleaBargain" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ed5578672fe1e1dfc9728d1c596" UNIQUE ("humanResourceId"), CONSTRAINT "REL_ed5578672fe1e1dfc9728d1c59" UNIQUE ("humanResourceId"), CONSTRAINT "PK_5dc7f96d974516687a9fc640431" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "academic_qualifications_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "academicQualificationId" uuid NOT NULL, "humanResourceId" uuid NOT NULL, "degree" character varying(200) NOT NULL, "major" character varying(200) NOT NULL, "institute" character varying(300) NOT NULL, "country" character varying(100) NOT NULL, "yearOfPassing" character varying(50) NOT NULL, "grade" character varying(50) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "academicCertificate" uuid, CONSTRAINT "PK_c7d7ee701817adeb988f47409d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."warehouse_location_status_enum" RENAME TO "warehouse_location_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."warehouse_location_status_enum" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED', 'RESUBMITTED')`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ALTER COLUMN "status" TYPE "public"."warehouse_location_status_enum" USING "status"::"text"::"public"."warehouse_location_status_enum"`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_location_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "human_resources_general_info_history" ADD CONSTRAINT "FK_93b8dea20d36dfdd6154dfa4d90" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources_general_info_history" ADD CONSTRAINT "FK_8c07053e6a3934329f846bbd3b2" FOREIGN KEY ("photograph") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trainings_history" ADD CONSTRAINT "FK_e5e54b24c22f6fc923f44f1132f" FOREIGN KEY ("trainingId") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trainings_history" ADD CONSTRAINT "FK_d5aec323ac4829f4c4a50bb6740" FOREIGN KEY ("trainingCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trainings_history" ADD CONSTRAINT "FK_faf8ea8d075eed111dac7bc2c13" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications_history" ADD CONSTRAINT "FK_bebf88b88d3ae3e447a1908629d" FOREIGN KEY ("professionalQualificationId") REFERENCES "professional_qualifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications_history" ADD CONSTRAINT "FK_70ec1d401af05e0913ecb141daa" FOREIGN KEY ("professionalCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications_history" ADD CONSTRAINT "FK_16c203d1be4ba1f47b71a0eed81" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_experiences_history" ADD CONSTRAINT "FK_bca4f03209d3cf1922596352029" FOREIGN KEY ("professionalExperienceId") REFERENCES "professional_experiences"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_experiences_history" ADD CONSTRAINT "FK_0b6a517111d950b0bc1bd006437" FOREIGN KEY ("experienceLetter") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_experiences_history" ADD CONSTRAINT "FK_f0e144a2392115cf94e3c3836b0" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" ADD CONSTRAINT "FK_7d0e863a77ec873efc18225891a" FOREIGN KEY ("declarationId") REFERENCES "hr_declarations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" ADD CONSTRAINT "FK_ed5578672fe1e1dfc9728d1c596" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications_history" ADD CONSTRAINT "FK_e4e75a633474c9fe24e78e8665b" FOREIGN KEY ("academicQualificationId") REFERENCES "academic_qualifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications_history" ADD CONSTRAINT "FK_a6fa9c04e282ba2f9977c1c8f23" FOREIGN KEY ("academicCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications_history" ADD CONSTRAINT "FK_7b8eb88af22388feaf301470c1b" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "academic_qualifications_history" DROP CONSTRAINT "FK_7b8eb88af22388feaf301470c1b"`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications_history" DROP CONSTRAINT "FK_a6fa9c04e282ba2f9977c1c8f23"`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications_history" DROP CONSTRAINT "FK_e4e75a633474c9fe24e78e8665b"`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" DROP CONSTRAINT "FK_ed5578672fe1e1dfc9728d1c596"`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" DROP CONSTRAINT "FK_7d0e863a77ec873efc18225891a"`);
        await queryRunner.query(`ALTER TABLE "professional_experiences_history" DROP CONSTRAINT "FK_f0e144a2392115cf94e3c3836b0"`);
        await queryRunner.query(`ALTER TABLE "professional_experiences_history" DROP CONSTRAINT "FK_0b6a517111d950b0bc1bd006437"`);
        await queryRunner.query(`ALTER TABLE "professional_experiences_history" DROP CONSTRAINT "FK_bca4f03209d3cf1922596352029"`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications_history" DROP CONSTRAINT "FK_16c203d1be4ba1f47b71a0eed81"`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications_history" DROP CONSTRAINT "FK_70ec1d401af05e0913ecb141daa"`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications_history" DROP CONSTRAINT "FK_bebf88b88d3ae3e447a1908629d"`);
        await queryRunner.query(`ALTER TABLE "trainings_history" DROP CONSTRAINT "FK_faf8ea8d075eed111dac7bc2c13"`);
        await queryRunner.query(`ALTER TABLE "trainings_history" DROP CONSTRAINT "FK_d5aec323ac4829f4c4a50bb6740"`);
        await queryRunner.query(`ALTER TABLE "trainings_history" DROP CONSTRAINT "FK_e5e54b24c22f6fc923f44f1132f"`);
        await queryRunner.query(`ALTER TABLE "human_resources_general_info_history" DROP CONSTRAINT "FK_8c07053e6a3934329f846bbd3b2"`);
        await queryRunner.query(`ALTER TABLE "human_resources_general_info_history" DROP CONSTRAINT "FK_93b8dea20d36dfdd6154dfa4d90"`);
        await queryRunner.query(`CREATE TYPE "public"."warehouse_location_status_enum_old" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED')`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ALTER COLUMN "status" TYPE "public"."warehouse_location_status_enum_old" USING "status"::"text"::"public"."warehouse_location_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "warehouse_location" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_location_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."warehouse_location_status_enum_old" RENAME TO "warehouse_location_status_enum"`);
        await queryRunner.query(`DROP TABLE "academic_qualifications_history"`);
        await queryRunner.query(`DROP TABLE "hr_declarations_history"`);
        await queryRunner.query(`DROP TABLE "professional_experiences_history"`);
        await queryRunner.query(`DROP TABLE "professional_qualifications_history"`);
        await queryRunner.query(`DROP TABLE "trainings_history"`);
        await queryRunner.query(`DROP TABLE "human_resources_general_info_history"`);
    }

}
