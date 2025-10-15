import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsSingleColumnToFormFields1760000000005
  implements MigrationInterface
{
  name = 'AddIsSingleColumnToFormFields1760000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isSingle column to form_fields table
    await queryRunner.query(
      `ALTER TABLE "form_fields" ADD COLUMN "isSingle" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove isSingle column from form_fields table
    await queryRunner.query(
      `ALTER TABLE "form_fields" DROP COLUMN "isSingle"`,
    );
  }
}
