import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSentToHodStatus1768000000000 implements MigrationInterface {
  name = 'AddSentToHodStatus1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add SENT_TO_HOD to the registration_application_status_enum
    await queryRunner.query(`
      ALTER TYPE "public"."registration_application_status_enum" 
      ADD VALUE IF NOT EXISTS 'SENT_TO_HOD'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // To rollback, you would need to recreate the enum type without SENT_TO_HOD
    // This is a simplified rollback that doesn't actually remove the enum value
    // In production, consider a more complex migration if rollback is critical
    console.log('Warning: Cannot remove enum value SENT_TO_HOD. Manual intervention required for rollback.');
  }
}

