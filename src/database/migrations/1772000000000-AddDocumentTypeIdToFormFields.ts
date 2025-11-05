import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentTypeIdToFormFields1772000000000 implements MigrationInterface {
  name = 'AddDocumentTypeIdToFormFields1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add documentTypeId column to form_fields table
    await queryRunner.query(`
      ALTER TABLE "form_fields" 
      ADD COLUMN "documentTypeId" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "form_fields" 
      ADD CONSTRAINT "FK_form_fields_document_type" 
      FOREIGN KEY ("documentTypeId") 
      REFERENCES "document_types"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    // Add index for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_form_fields_documentTypeId" 
      ON "form_fields" ("documentTypeId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_form_fields_documentTypeId"`);
    await queryRunner.query(`ALTER TABLE "form_fields" DROP CONSTRAINT "FK_form_fields_document_type"`);
    await queryRunner.query(`ALTER TABLE "form_fields" DROP COLUMN "documentTypeId"`);
  }
}

