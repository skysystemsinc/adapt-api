import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemarksToRegistrationApplicationDetails1769000000000 implements MigrationInterface {
  name = 'AddRemarksToRegistrationApplicationDetails1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "registration_application_details" 
      ADD COLUMN "remarks" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "registration_application_details" 
      DROP COLUMN "remarks"
    `);
  }
}

