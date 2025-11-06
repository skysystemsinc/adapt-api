import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsTable1762399406049 implements MigrationInterface {
  name = 'CreateSettingsTable1762399406049';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "value" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_settings_key" UNIQUE ("key")
      )
    `);

    // Create index on key for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_settings_key" ON "settings" ("key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_settings_key"`);
    await queryRunner.query(`DROP TABLE "settings"`);
  }
}

