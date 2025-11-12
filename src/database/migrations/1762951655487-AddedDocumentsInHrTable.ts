import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedDocumentsInHrTable1762951655487 implements MigrationInterface {
    name = 'AddedDocumentsInHrTable1762951655487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_personal_details" ADD "photographDocumentId" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" ADD "academicCertificateDocumentId" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" ADD "professionalCertificateDocumentId" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" ADD "trainingCertificateDocumentId" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_experience" ADD "experienceLetterDocumentId" uuid`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" ADD CONSTRAINT "FK_ec9d0e1653759d5c1142f33faae" FOREIGN KEY ("photographDocumentId") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" ADD CONSTRAINT "FK_883f27525d396a4bd58843fd9a6" FOREIGN KEY ("academicCertificateDocumentId") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" ADD CONSTRAINT "FK_34f3ef15dee3d73f1d813253b1f" FOREIGN KEY ("professionalCertificateDocumentId") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" ADD CONSTRAINT "FK_9a290d547348ba7e89e246348b7" FOREIGN KEY ("trainingCertificateDocumentId") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_experience" ADD CONSTRAINT "FK_1562f753e04c25cb235b243faf6" FOREIGN KEY ("experienceLetterDocumentId") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_experience" DROP CONSTRAINT "FK_1562f753e04c25cb235b243faf6"`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" DROP CONSTRAINT "FK_9a290d547348ba7e89e246348b7"`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" DROP CONSTRAINT "FK_34f3ef15dee3d73f1d813253b1f"`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" DROP CONSTRAINT "FK_883f27525d396a4bd58843fd9a6"`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" DROP CONSTRAINT "FK_ec9d0e1653759d5c1142f33faae"`);
        await queryRunner.query(`ALTER TABLE "hr_experience" DROP COLUMN "experienceLetterDocumentId"`);
        await queryRunner.query(`ALTER TABLE "hr_trainings" DROP COLUMN "trainingCertificateDocumentId"`);
        await queryRunner.query(`ALTER TABLE "hr_professional_qualifications" DROP COLUMN "professionalCertificateDocumentId"`);
        await queryRunner.query(`ALTER TABLE "hr_academic_qualifications" DROP COLUMN "academicCertificateDocumentId"`);
        await queryRunner.query(`ALTER TABLE "hr_personal_details" DROP COLUMN "photographDocumentId"`);
    }

}
