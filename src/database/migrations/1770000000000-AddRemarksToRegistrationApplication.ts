import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemarksToRegistrationApplication1770000000000 implements MigrationInterface {
  name = 'AddRemarksToRegistrationApplication1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "registration_application" 
      ADD COLUMN "remarks" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "registration_application" 
      DROP COLUMN "remarks"
    `);
  }
}

