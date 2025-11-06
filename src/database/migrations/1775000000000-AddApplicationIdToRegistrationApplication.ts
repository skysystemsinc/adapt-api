import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApplicationIdToRegistrationApplication1762449141540 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create a sequence for the application number
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS registration_application_number_seq 
            START WITH 1 
            INCREMENT BY 1;
        `);

        // Add the applicationId column
        await queryRunner.query(`
            ALTER TABLE "registration_application" 
            ADD COLUMN "applicationId" VARCHAR(20) UNIQUE;
        `);

        // Create a function to generate the application ID
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION generate_application_id()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW."applicationId" IS NULL THEN
                    NEW."applicationId" := 'APP-' || LPAD(nextval('registration_application_number_seq')::TEXT, 4, '0');
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create a trigger to auto-generate applicationId on insert
        await queryRunner.query(`
            CREATE TRIGGER generate_application_id_trigger
            BEFORE INSERT ON "registration_application"
            FOR EACH ROW
            EXECUTE FUNCTION generate_application_id();
        `);

        // Backfill existing records with applicationId using FROM clause
        await queryRunner.query(`
            UPDATE "registration_application" ra
            SET "applicationId" = 'APP-' || LPAD(ranked.row_num::TEXT, 4, '0')
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as row_num
                FROM "registration_application"
                WHERE "applicationId" IS NULL
            ) ranked
            WHERE ra.id = ranked.id;
        `);

        // Update the sequence to start from the correct number
        await queryRunner.query(`
            SELECT setval('registration_application_number_seq', 
                (SELECT COUNT(*) FROM "registration_application") + 1, 
                false
            );
        `);

        // Make the column NOT NULL after backfilling
        await queryRunner.query(`
            ALTER TABLE "registration_application" 
            ALTER COLUMN "applicationId" SET NOT NULL;
        `);

        // Create index for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_registration_application_applicationId" 
            ON "registration_application" ("applicationId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_registration_application_applicationId";
        `);

        // Drop trigger
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS generate_application_id_trigger 
            ON "registration_application";
        `);

        // Drop function
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS generate_application_id();
        `);

        // Drop column
        await queryRunner.query(`
            ALTER TABLE "registration_application" 
            DROP COLUMN IF EXISTS "applicationId";
        `);

        // Drop sequence
        await queryRunner.query(`
            DROP SEQUENCE IF EXISTS registration_application_number_seq;
        `);
    }

}
