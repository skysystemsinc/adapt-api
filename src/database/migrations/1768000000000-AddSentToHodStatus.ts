import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSentToHodStatus1768000000000 implements MigrationInterface {
  name = 'AddSentToHodStatus1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SENT_TO_HOD is now included in the initial enum creation (1758000000000-CreatePrerequisites.ts)
    // This migration is kept for backwards compatibility with existing databases
    // The IF NOT EXISTS clause ensures this won't fail if the value already exists
    await queryRunner.query(`
      ALTER TYPE "public"."registration_application_status_enum" 
      ADD VALUE IF NOT EXISTS 'SENT_TO_HOD'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    console.log('Warning: Cannot remove enum value SENT_TO_HOD. Manual intervention required for rollback.');
  }
}
