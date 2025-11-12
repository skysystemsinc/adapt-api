import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentInHrTable1762958762983 implements MigrationInterface {
    name = 'AddDocumentInHrTable1762958762983'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_personal_details" ADD "photograph" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" ADD "academicCertificate" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" ADD "professionalCertificate" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" ADD "trainingCertificate" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_experience" ADD "experienceLetter" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" ADD CONSTRAINT "FK_e64c8b3fedebac98bff091587da" FOREIGN KEY ("photograph") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" ADD CONSTRAINT "FK_0f6ca8c19a414a658d232d5fc18" FOREIGN KEY ("academicCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" ADD CONSTRAINT "FK_65fb2a9963cea8d6054d54c35a8" FOREIGN KEY ("professionalCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" ADD CONSTRAINT "FK_53d317b80fbff52ef196dd5a2f1" FOREIGN KEY ("trainingCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_experience" ADD CONSTRAINT "FK_afa96d4aa9dc1133a9bee3f6a16" FOREIGN KEY ("experienceLetter") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_experience" DROP CONSTRAINT "FK_afa96d4aa9dc1133a9bee3f6a16"`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" DROP CONSTRAINT "FK_53d317b80fbff52ef196dd5a2f1"`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" DROP CONSTRAINT "FK_65fb2a9963cea8d6054d54c35a8"`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" DROP CONSTRAINT "FK_0f6ca8c19a414a658d232d5fc18"`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" DROP CONSTRAINT "FK_e64c8b3fedebac98bff091587da"`);
        await queryRunner.query(`ALTER TABLE "hr_experience" DROP COLUMN "experienceLetter"`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" DROP COLUMN "trainingCertificate"`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" DROP COLUMN "professionalCertificate"`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" DROP COLUMN "academicCertificate"`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" DROP COLUMN "photograph"`);
    }

}
