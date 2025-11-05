import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentTypeIdToRegistrationApplicationDetails1773000000000 implements MigrationInterface {
  name = 'AddDocumentTypeIdToRegistrationApplicationDetails1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add documentTypeId column to registration_application_details table
    await queryRunner.query(`
      ALTER TABLE "registration_application_details" 
      ADD COLUMN "documentTypeId" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "registration_application_details" 
      ADD CONSTRAINT "FK_registration_application_details_document_type" 
      FOREIGN KEY ("documentTypeId") 
      REFERENCES "document_types"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    // Add index for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_registration_application_details_documentTypeId" 
      ON "registration_application_details" ("documentTypeId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_registration_application_details_documentTypeId"`);
    await queryRunner.query(`ALTER TABLE "registration_application_details" DROP CONSTRAINT "FK_registration_application_details_document_type"`);
    await queryRunner.query(`ALTER TABLE "registration_application_details" DROP COLUMN "documentTypeId"`);
  }
}

