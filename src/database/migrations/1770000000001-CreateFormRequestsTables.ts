import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormRequestsTables1770000000001
  implements MigrationInterface
{
  name = 'CreateFormRequestsTables1770000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // -------------------------
    // Create ENUM safely
    // -------------------------
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'form_request_status_enum'
        ) THEN
          CREATE TYPE "form_request_status_enum" AS ENUM('pending', 'approved', 'rejected');
        END IF;
      END
      $$;
    `);

    // -------------------------
    // Create form_requests table IF NOT EXISTS
    // -------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "form_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "formId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "schema" jsonb NOT NULL,
        "isPublic" boolean NOT NULL DEFAULT true,
        "status" "form_request_status_enum" NOT NULL DEFAULT 'pending',
        "version" character varying,
        "requestedBy" uuid,
        "reviewedBy" uuid,
        "reviewedAt" TIMESTAMP,
        "reviewNotes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_form_requests_id" PRIMARY KEY ("id")
      );
    `);

    // -------------------------
    // Add FK if it does not exist
    // -------------------------
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_form_requests_formId'
        ) THEN
          ALTER TABLE "form_requests" 
          ADD CONSTRAINT "FK_form_requests_formId" 
          FOREIGN KEY ("formId") REFERENCES "forms"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // -------------------------
    // Indexes for form_requests
    // -------------------------
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_form_requests_formId" ON "form_requests" ("formId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_form_requests_status" ON "form_requests" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_form_requests_slug" ON "form_requests" ("slug");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_form_requests_requestedBy" ON "form_requests" ("requestedBy");
    `);

    // -------------------------
    // Create form_fields_requests table IF NOT EXISTS
    // -------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "form_fields_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "formRequestId" uuid NOT NULL,
        "fieldKey" character varying NOT NULL,
        "label" character varying,
        "title" character varying,
        "type" character varying NOT NULL,
        "options" jsonb,
        "required" boolean NOT NULL DEFAULT false,
        "isSingle" boolean NOT NULL DEFAULT false,
        "placeholder" character varying,
        "validation" jsonb,
        "conditions" jsonb,
        "order" integer NOT NULL,
        "step" integer NOT NULL,
        "metadata" jsonb,
        "width" character varying DEFAULT 'full',
        "includeInKycVerification" boolean NOT NULL DEFAULT false,
        "version" character varying,
        "originalFieldId" uuid,
        "action" character varying NOT NULL DEFAULT 'update',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_form_fields_requests" PRIMARY KEY ("id")
      );
    `);

    // -------------------------
    // FK for form_fields_requests
    // -------------------------
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_form_fields_requests_formRequestId'
        ) THEN
          ALTER TABLE "form_fields_requests"
          ADD CONSTRAINT "FK_form_fields_requests_formRequestId"
          FOREIGN KEY ("formRequestId") REFERENCES "form_requests"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // -------------------------
    // Indexes for form_fields_requests
    // -------------------------
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_form_fields_requests_formRequestId" 
      ON "form_fields_requests" ("formRequestId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_form_fields_requests_fieldKey" 
      ON "form_fields_requests" ("fieldKey");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_form_fields_requests_action" 
      ON "form_fields_requests" ("action");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_form_fields_requests_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_form_fields_requests_fieldKey"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_form_fields_requests_formRequestId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_form_requests_requestedBy"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_form_requests_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_form_requests_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_form_requests_formId"`);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "form_fields_requests" CASCADE;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "form_requests" CASCADE;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "form_request_status_enum";
    `);
  }
}
