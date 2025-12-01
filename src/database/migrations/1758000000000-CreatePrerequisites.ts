import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePrerequisites1758000000000 implements MigrationInterface {
    name = 'CreatePrerequisites1758000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable uuid-ossp extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create registration_application_status_enum if not exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'registration_application_status_enum'
                ) THEN
                    CREATE TYPE "public"."registration_application_status_enum" AS ENUM(
                        'PENDING', 
                        'IN_PROCESS', 
                        'APPROVED', 
                        'REJECTED',
                        'SENT_TO_HOD'
                    );
                END IF;
            END
            $$;
        `);

        // Create registration_application_details_status_enum if not exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'registration_application_details_status_enum'
                ) THEN
                    CREATE TYPE "public"."registration_application_details_status_enum" AS ENUM(
                        'PENDING', 
                        'APPROVED', 
                        'REJECTED'
                    );
                END IF;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."registration_application_details_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."registration_application_status_enum"`);
    }
}
