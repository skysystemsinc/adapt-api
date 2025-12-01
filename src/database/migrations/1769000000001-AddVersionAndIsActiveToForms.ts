import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionAndIsActiveToForms1769000000001
  implements MigrationInterface
{
  name = 'AddVersionAndIsActiveToForms1769000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add version column IF NOT EXISTS
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns
          WHERE table_name='forms'
          AND column_name='version'
        ) THEN
          ALTER TABLE "forms" ADD COLUMN "version" character varying;
        END IF;
      END
      $$;
    `);

    // Add isActive column IF NOT EXISTS
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns
          WHERE table_name='forms'
          AND column_name='isActive'
        ) THEN
          ALTER TABLE "forms" ADD COLUMN "isActive" boolean NOT NULL DEFAULT true;
        END IF;
      END
      $$;
    `);

    // Create index IF NOT EXISTS (Postgres 9.5+)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_forms_isActive" ON "forms" ("isActive");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_forms_version" ON "forms" ("version");
    `);

    // -------------------------
    // Business Logic (Safe)
    // -------------------------

    // Update older registration-form slugs
    await queryRunner.query(`
      UPDATE "forms"
      SET "slug" = 'registration-form-v1-' || SUBSTRING("id"::text, 1, 8)
      WHERE "slug" = 'registration-form'
      AND "id" NOT IN (
        SELECT "id" 
        FROM "forms" 
        WHERE "slug" = 'registration-form' 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      );
    `);

    // Set version + isActive flags
    await queryRunner.query(`
      UPDATE "forms"
      SET "version" = 'v1', "isActive" = false
      WHERE "slug" = 'registration-form'
         OR "slug" LIKE 'registration-form-v1-%';
    `);

    // Activate the latest form
    await queryRunner.query(`
      UPDATE "forms"
      SET "isActive" = true
      WHERE "slug" = 'registration-form';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes safely
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forms_version";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forms_isActive";`);

    // Drop columns safely
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='forms' AND column_name='isActive'
        ) THEN
          ALTER TABLE "forms" DROP COLUMN "isActive";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='forms' AND column_name='version'
        ) THEN
          ALTER TABLE "forms" DROP COLUMN "version";
        END IF;
      END
      $$;
    `);
  }
}
