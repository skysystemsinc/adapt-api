import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFormFieldsIdColumn1760000000003
  implements MigrationInterface
{
  name = 'FixFormFieldsIdColumn1760000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid-ossp extension is enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Set default UUID generation for the id column
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove default
    await queryRunner.query(
      `ALTER TABLE "form_fields" ALTER COLUMN "id" DROP DEFAULT`,
    );
  }
}

