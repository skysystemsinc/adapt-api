import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormsTable1760000000000 implements MigrationInterface {
  name = 'CreateFormsTable1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "forms_status_enum" AS ENUM('draft', 'published')
    `);

    await queryRunner.query(`
      CREATE TABLE "forms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "schema" jsonb NOT NULL,
        "isPublic" boolean NOT NULL DEFAULT true,
        "status" "forms_status_enum" NOT NULL DEFAULT 'published',
        "createdBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_forms_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_forms_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_forms_slug" ON "forms" ("slug")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_forms_status" ON "forms" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_forms_isPublic" ON "forms" ("isPublic")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_forms_isPublic"`);
    await queryRunner.query(`DROP INDEX "IDX_forms_status"`);
    await queryRunner.query(`DROP INDEX "IDX_forms_slug"`);
    await queryRunner.query(`DROP TABLE "forms"`);
    await queryRunner.query(`DROP TYPE "forms_status_enum"`);
  }
}

