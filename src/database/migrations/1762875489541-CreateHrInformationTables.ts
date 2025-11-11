import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHrInformationTables1762875489541 implements MigrationInterface {
    name = 'CreateHrInformationTables1762875489541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_personal_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "designationId" uuid, "name" character varying(100) NOT NULL, "fathersHusbandName" character varying(100) NOT NULL, "cnicPassport" character varying(13) NOT NULL, "nationality" character varying(100) NOT NULL, "dateOfBirth" date NOT NULL, "residentialAddress" text NOT NULL, "businessAddress" text, "telephone" character varying(100), "mobileNumber" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "nationalTaxNumber" character varying(100), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9831948dd80cfeb0f74909d9032" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hr_academic_qualifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "degree" character varying(100) NOT NULL, "major" character varying(100) NOT NULL, "institute" character varying(100) NOT NULL, "country" character varying(100) NOT NULL, "yearOfPassing" character varying(100) NOT NULL, "grade" character varying(100), "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a09701ce728d11f81dd13edbb48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hr_professional_qualifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "certificationTitle" character varying(150) NOT NULL, "issuingBody" character varying(150) NOT NULL, "country" character varying(100) NOT NULL, "dateOfAward" character varying(20) NOT NULL, "validity" character varying(20), "membershipNumber" character varying(100), "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_daf24d41e74587888a394d99c2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hr_trainings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "trainingTitle" character varying(150) NOT NULL, "conductedBy" character varying(150) NOT NULL, "trainingType" character varying(100) NOT NULL, "durationStart" character varying(20) NOT NULL, "durationEnd" character varying(20) NOT NULL, "dateOfCompletion" character varying(20) NOT NULL, "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_def3a70b232bb477e2907837c05" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hr_experience" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "positionHeld" character varying(150) NOT NULL, "organizationName" character varying(180) NOT NULL, "organizationAddress" character varying(255) NOT NULL, "natureOfOrganization" character varying(120) NOT NULL, "dateOfAppointment" character varying(20) NOT NULL, "dateOfLeaving" character varying(20), "duration" character varying(50), "responsibilities" text, "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9698949051264948d463032efb5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hr_declaration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "writeOffAvailed" character varying(10) NOT NULL, "defaultOfFinance" character varying(10) NOT NULL, "placementOnECL" character varying(10) NOT NULL, "convictionPleaBargain" character varying(10) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0be358cc3aaef12b3a96681256c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hrs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "personalDetailsId" uuid, "declarationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_0b931051e3d090ac4ffc92eb3a" UNIQUE ("personalDetailsId"), CONSTRAINT "REL_59e52f6b18dcb42dc0410699f8" UNIQUE ("declarationId"), CONSTRAINT "PK_bd6eaa9c34ebf602515e8fca8db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" ADD CONSTRAINT "FK_26bdd58abfb427f62977d0080e5" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" ADD CONSTRAINT "FK_1117fe899c696c5f5020f9d6e6b" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" ADD CONSTRAINT "FK_ea663465b7f3df64ac783ad5125" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" ADD CONSTRAINT "FK_92afe9bffe9437198fdb1706882" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_experience" ADD CONSTRAINT "FK_c6a2ad9156377b4b4e9662a79bb" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hrs" ADD CONSTRAINT "FK_f5cbf2824b8738b7ccacf114017" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hrs" ADD CONSTRAINT "FK_0b931051e3d090ac4ffc92eb3a5" FOREIGN KEY ("personalDetailsId") REFERENCES "hr_personal_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hrs" ADD CONSTRAINT "FK_59e52f6b18dcb42dc0410699f89" FOREIGN KEY ("declarationId") REFERENCES "hr_declaration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hrs" DROP CONSTRAINT "FK_59e52f6b18dcb42dc0410699f89"`);
        await queryRunner.query(`ALTER TABLE "hrs" DROP CONSTRAINT "FK_0b931051e3d090ac4ffc92eb3a5"`);
        await queryRunner.query(`ALTER TABLE "hrs" DROP CONSTRAINT "FK_f5cbf2824b8738b7ccacf114017"`);
        await queryRunner.query(`ALTER TABLE "hr_experience" DROP CONSTRAINT "FK_c6a2ad9156377b4b4e9662a79bb"`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" DROP CONSTRAINT "FK_92afe9bffe9437198fdb1706882"`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" DROP CONSTRAINT "FK_ea663465b7f3df64ac783ad5125"`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" DROP CONSTRAINT "FK_1117fe899c696c5f5020f9d6e6b"`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" DROP CONSTRAINT "FK_26bdd58abfb427f62977d0080e5"`);
        await queryRunner.query(`DROP TABLE "hrs"`);
        await queryRunner.query(`DROP TABLE "hr_declaration"`);
        await queryRunner.query(`DROP TABLE "hr_experience"`);
        await queryRunner.query(`DROP TABLE "hr_trainings"`);
        await queryRunner.query(`DROP TABLE "hr_professional_qualifications"`);
        await queryRunner.query(`DROP TABLE "hr_academic_qualifications"`);
        await queryRunner.query(`DROP TABLE "hr_personal_details"`);
    }

}
