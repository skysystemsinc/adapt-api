import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTypesTable1771000000000 implements MigrationInterface {
  name = 'CreateDocumentTypesTable1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "document_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_document_types" PRIMARY KEY ("id")
      )
    `);

    // Create index on deletedAt for soft delete queries
    await queryRunner.query(`
      CREATE INDEX "IDX_document_types_deletedAt" ON "document_types" ("deletedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_document_types_deletedAt"`);
    await queryRunner.query(`DROP TABLE "document_types"`);
  }
}

