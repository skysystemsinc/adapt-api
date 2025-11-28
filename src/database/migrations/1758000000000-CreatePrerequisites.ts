import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePrerequisites1758000000000 implements MigrationInterface {
    name = 'CreatePrerequisites1758000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure uuid-ossp extension is enabled for UUID generation
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create registration_application_status_enum (used by registration_application table)
        await queryRunner.query(`
            CREATE TYPE "public"."registration_application_status_enum" AS ENUM(
                'PENDING', 
                'IN_PROCESS', 
                'APPROVED', 
                'REJECTED',
                'SENT_TO_HOD'
            )
        `);

        // Create registration_application_details_status_enum (used by registration_application_details table)
        await queryRunner.query(`
            CREATE TYPE "public"."registration_application_details_status_enum" AS ENUM(
                'PENDING', 
                'APPROVED', 
                'REJECTED'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."registration_application_details_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."registration_application_status_enum"`);
    }
}

