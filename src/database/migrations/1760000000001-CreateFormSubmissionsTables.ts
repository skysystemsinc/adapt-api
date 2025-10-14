import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormSubmissionsTables1760000000001
  implements MigrationInterface
{
  name = 'CreateFormSubmissionsTables1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create submission status enum
    await queryRunner.query(
      `CREATE TYPE "public"."form_submissions_status_enum" AS ENUM('draft', 'submitted')`,
    );

    // Create form_submissions table
    await queryRunner.query(
      `CREATE TABLE "form_submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "formId" uuid NOT NULL,
        "userId" uuid,
        "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "meta" jsonb,
        "status" "public"."form_submissions_status_enum" NOT NULL DEFAULT 'submitted',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_form_submissions" PRIMARY KEY ("id")
      )`,
    );

    // Create form_submission_values table
    await queryRunner.query(
      `CREATE TABLE "form_submission_values" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "submissionId" uuid NOT NULL,
        "fieldKey" character varying NOT NULL,
        "value" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_form_submission_values" PRIMARY KEY ("id")
      )`,
    );

    // Add foreign key: form_submissions.formId -> forms.id
    await queryRunner.query(
      `ALTER TABLE "form_submissions" 
       ADD CONSTRAINT "FK_form_submissions_formId" 
       FOREIGN KEY ("formId") REFERENCES "forms"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Add foreign key: form_submission_values.submissionId -> form_submissions.id
    await queryRunner.query(
      `ALTER TABLE "form_submission_values" 
       ADD CONSTRAINT "FK_form_submission_values_submissionId" 
       FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Create indexes for better query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_form_submissions_formId" ON "form_submissions" ("formId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_form_submissions_userId" ON "form_submissions" ("userId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_form_submissions_status" ON "form_submissions" ("status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_form_submission_values_submissionId" ON "form_submission_values" ("submissionId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_form_submission_values_fieldKey" ON "form_submission_values" ("fieldKey")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_form_submission_values_fieldKey"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_form_submission_values_submissionId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_form_submissions_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_form_submissions_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_form_submissions_formId"`,
    );

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "form_submission_values" DROP CONSTRAINT "FK_form_submission_values_submissionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_submissions" DROP CONSTRAINT "FK_form_submissions_formId"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "form_submission_values"`);
    await queryRunner.query(`DROP TABLE "form_submissions"`);

    // Drop enum
    await queryRunner.query(
      `DROP TYPE "public"."form_submissions_status_enum"`,
    );
  }
}

