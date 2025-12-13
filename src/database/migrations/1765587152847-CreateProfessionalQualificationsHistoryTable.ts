import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProfessionalQualificationsHistoryTable1765587152847 implements MigrationInterface {
    name = 'CreateProfessionalQualificationsHistoryTable1765587152847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_professional_qualifications_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "professionalQualificationsId" uuid NOT NULL, "certificationTitle" character varying(150) NOT NULL, "issuingBody" character varying(150) NOT NULL, "country" character varying(100) NOT NULL, "dateOfAward" character varying(20) NOT NULL, "validity" character varying(20), "membershipNumber" character varying(100), "professionalCertificate" uuid, "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb0d09a27be51bd834edf7eedc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications_history" ADD CONSTRAINT "FK_81213e282c97d8bde9fada1188d" FOREIGN KEY ("professionalQualificationsId") REFERENCES "hr_professional_qualifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications_history" ADD CONSTRAINT "FK_6fea6b96c660ce15534e9bc51d7" FOREIGN KEY ("professionalCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications_history" ADD CONSTRAINT "FK_a668302c216024f5db87007e359" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications_history" DROP CONSTRAINT "FK_a668302c216024f5db87007e359"`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications_history" DROP CONSTRAINT "FK_6fea6b96c660ce15534e9bc51d7"`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications_history" DROP CONSTRAINT "FK_81213e282c97d8bde9fada1188d"`);
        await queryRunner.query(`DROP TABLE "hr_professional_qualifications_history"`);
    }

}
