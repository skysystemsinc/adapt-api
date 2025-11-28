import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionAndIsActiveToForms1769000000001
  implements MigrationInterface
{
  name = 'AddVersionAndIsActiveToForms1769000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add version column (nullable for existing records)
    await queryRunner.query(`
      ALTER TABLE "forms"
      ADD COLUMN "version" character varying
    `);

    // Add isActive column (default true for existing records)
    await queryRunner.query(`
      ALTER TABLE "forms"
      ADD COLUMN "isActive" boolean NOT NULL DEFAULT true
    `);

    // Create index on isActive for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_forms_isActive" ON "forms" ("isActive")
    `);

    // Create index on version for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_forms_version" ON "forms" ("version")
    `);

    // Handle existing registration forms
    // First, change slugs of older registration forms to avoid conflicts
    // Keep the most recent one with slug 'registration-form'
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
      )
    `);
    
    // Set all registration forms to version v1 and inactive initially
    await queryRunner.query(`
      UPDATE "forms"
      SET "version" = 'v1', "isActive" = false
      WHERE "slug" = 'registration-form' OR "slug" LIKE 'registration-form-v1-%'
    `);
    
    // Set the most recent registration form (still with slug 'registration-form') as active
    await queryRunner.query(`
      UPDATE "forms"
      SET "isActive" = true
      WHERE "slug" = 'registration-form'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_forms_version"`);
    await queryRunner.query(`DROP INDEX "IDX_forms_isActive"`);
    await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN "isActive"`);
    await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN "version"`);
  }
}

