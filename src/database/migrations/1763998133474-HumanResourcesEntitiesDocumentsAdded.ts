import { MigrationInterface, QueryRunner } from "typeorm";

export class HumanResourcesEntitiesDocumentsAdded1763998133474 implements MigrationInterface {
    name = 'HumanResourcesEntitiesDocumentsAdded1763998133474'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "academic_qualifications" DROP COLUMN "academicCertificate"`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications" ADD "academicCertificate" uuid`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications" DROP COLUMN "professionalCertificate"`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications" ADD "professionalCertificate" uuid`);
        await queryRunner.query(`ALTER TABLE "trainings" DROP COLUMN "trainingCertificate"`);
        await queryRunner.query(`ALTER TABLE "trainings" ADD "trainingCertificate" uuid`);
        await queryRunner.query(`ALTER TABLE "professional_experiences" DROP COLUMN "experienceLetter"`);
        await queryRunner.query(`ALTER TABLE "professional_experiences" ADD "experienceLetter" uuid`);
        await queryRunner.query(`ALTER TABLE "human_resources" DROP COLUMN "photograph"`);
        await queryRunner.query(`ALTER TABLE "human_resources" ADD "photograph" uuid`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications" ADD CONSTRAINT "FK_686d0fd30984f65aaa51f631254" FOREIGN KEY ("academicCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications" ADD CONSTRAINT "FK_5ae3109624cef01fdd5bcbf2a44" FOREIGN KEY ("professionalCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trainings" ADD CONSTRAINT "FK_e08897f6abe9c2fc0db5a35e7c0" FOREIGN KEY ("trainingCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "professional_experiences" ADD CONSTRAINT "FK_19ddd944e7c89cc5e3c8c8c0690" FOREIGN KEY ("experienceLetter") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "human_resources" ADD CONSTRAINT "FK_b58acb19ccc12253e6ffb54dc60" FOREIGN KEY ("photograph") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "human_resources" DROP CONSTRAINT "FK_b58acb19ccc12253e6ffb54dc60"`);
        await queryRunner.query(`ALTER TABLE "professional_experiences" DROP CONSTRAINT "FK_19ddd944e7c89cc5e3c8c8c0690"`);
        await queryRunner.query(`ALTER TABLE "trainings" DROP CONSTRAINT "FK_e08897f6abe9c2fc0db5a35e7c0"`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications" DROP CONSTRAINT "FK_5ae3109624cef01fdd5bcbf2a44"`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications" DROP CONSTRAINT "FK_686d0fd30984f65aaa51f631254"`);
        await queryRunner.query(`ALTER TABLE "human_resources" DROP COLUMN "photograph"`);
        await queryRunner.query(`ALTER TABLE "human_resources" ADD "photograph" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "professional_experiences" DROP COLUMN "experienceLetter"`);
        await queryRunner.query(`ALTER TABLE "professional_experiences" ADD "experienceLetter" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "trainings" DROP COLUMN "trainingCertificate"`);
        await queryRunner.query(`ALTER TABLE "trainings" ADD "trainingCertificate" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications" DROP COLUMN "professionalCertificate"`);
        await queryRunner.query(`ALTER TABLE "professional_qualifications" ADD "professionalCertificate" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications" DROP COLUMN "academicCertificate"`);
        await queryRunner.query(`ALTER TABLE "academic_qualifications" ADD "academicCertificate" character varying(500)`);
    }

}
