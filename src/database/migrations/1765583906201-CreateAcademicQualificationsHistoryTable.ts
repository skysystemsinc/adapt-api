import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAcademicQualificationsHistoryTable1765583906201 implements MigrationInterface {
    name = 'CreateAcademicQualificationsHistoryTable1765583906201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_academic_qualifications_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "academicQualificationsId" uuid NOT NULL, "degree" character varying(100) NOT NULL, "major" character varying(100) NOT NULL, "institute" character varying(100) NOT NULL, "country" character varying(100) NOT NULL, "yearOfPassing" character varying(100) NOT NULL, "grade" character varying(100), "academicCertificate" uuid, "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e4c20ba0e21ab84c8859934258" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications_history" ADD CONSTRAINT "FK_a2cfd6eb8e7e95b87c5569deb40" FOREIGN KEY ("academicQualificationsId") REFERENCES "hr_academic_qualifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications_history" ADD CONSTRAINT "FK_e180c5e7cd62849155af240fa14" FOREIGN KEY ("academicCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications_history" ADD CONSTRAINT "FK_422136561fed3170909b1f38982" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications_history" DROP CONSTRAINT "FK_422136561fed3170909b1f38982"`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications_history" DROP CONSTRAINT "FK_e180c5e7cd62849155af240fa14"`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications_history" DROP CONSTRAINT "FK_a2cfd6eb8e7e95b87c5569deb40"`);
        await queryRunner.query(`DROP TABLE "hr_academic_qualifications_history"`);
    }

}
