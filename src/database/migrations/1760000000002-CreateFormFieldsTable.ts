import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormFieldsTable1760000000002
  implements MigrationInterface
{
  name = 'CreateFormFieldsTable1760000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create form_fields table
    await queryRunner.query(
      `CREATE TABLE "form_fields" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "formId" uuid NOT NULL,
        "fieldKey" character varying NOT NULL,
        "label" character varying NOT NULL,
        "type" character varying NOT NULL,
        "options" jsonb,
        "required" boolean NOT NULL DEFAULT false,
        "order" integer NOT NULL,
        "step" integer NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_form_fields" PRIMARY KEY ("id")
      )`,
    );

    // Add foreign key: form_fields.formId -> forms.id
    await queryRunner.query(
      `ALTER TABLE "form_fields" 
       ADD CONSTRAINT "FK_form_fields_formId" 
       FOREIGN KEY ("formId") REFERENCES "forms"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Create indexes for better query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_form_fields_formId" ON "form_fields" ("formId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_form_fields_fieldKey" ON "form_fields" ("fieldKey")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_form_fields_type" ON "form_fields" ("type")`,
    );

    // Create unique constraint for formId + fieldKey
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_form_fields_formId_fieldKey" ON "form_fields" ("formId", "fieldKey")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_form_fields_formId_fieldKey"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_form_fields_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_form_fields_fieldKey"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_form_fields_formId"`);

    // Drop foreign key
    await queryRunner.query(
      `ALTER TABLE "form_fields" DROP CONSTRAINT "FK_form_fields_formId"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "form_fields"`);
  }
}

