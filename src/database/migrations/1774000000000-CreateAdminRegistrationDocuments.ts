import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminRegistrationDocuments1774000000000 implements MigrationInterface {
    name = 'CreateAdminRegistrationDocuments1774000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create admin_registration_documents table
        await queryRunner.query(`
            CREATE TABLE "admin_registration_documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" uuid NOT NULL,
                "detailId" uuid NOT NULL,
                "document" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_admin_registration_documents" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraint for applicationId
        await queryRunner.query(`
            ALTER TABLE "admin_registration_documents"
            ADD CONSTRAINT "FK_admin_registration_documents_applicationId"
            FOREIGN KEY ("applicationId")
            REFERENCES "registration_application"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        // Add foreign key constraint for detailId
        await queryRunner.query(`
            ALTER TABLE "admin_registration_documents"
            ADD CONSTRAINT "FK_admin_registration_documents_detailId"
            FOREIGN KEY ("detailId")
            REFERENCES "registration_application_details"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        // Add indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_admin_registration_documents_applicationId"
            ON "admin_registration_documents" ("applicationId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_admin_registration_documents_detailId"
            ON "admin_registration_documents" ("detailId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_admin_registration_documents_detailId"`);
        await queryRunner.query(`DROP INDEX "IDX_admin_registration_documents_applicationId"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP CONSTRAINT "FK_admin_registration_documents_detailId"`);
        await queryRunner.query(`ALTER TABLE "admin_registration_documents" DROP CONSTRAINT "FK_admin_registration_documents_applicationId"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "admin_registration_documents"`);
    }
}

