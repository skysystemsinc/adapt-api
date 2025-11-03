import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncludeInKycVerificationToFormFields1767000000000
  implements MigrationInterface
{
  name = 'AddIncludeInKycVerificationToFormFields1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add includeInKycVerification column to form_fields table
    await queryRunner.query(
      `ALTER TABLE "form_fields" ADD COLUMN "includeInKycVerification" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove includeInKycVerification column from form_fields table
    await queryRunner.query(
      `ALTER TABLE "form_fields" DROP COLUMN "includeInKycVerification"`,
    );
  }
}

