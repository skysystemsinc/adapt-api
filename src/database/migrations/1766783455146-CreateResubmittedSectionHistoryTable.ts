import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResubmittedSectionHistoryTable1766783455146 implements MigrationInterface {
    name = 'CreateResubmittedSectionHistoryTable1766783455146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "resubmitted_sections_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "applicationId" uuid,
                "warehouseLocationId" uuid,
                "assignmentSectionHistoryId" uuid,
                "sectionType" character varying NOT NULL,
                "resourceId" uuid,
                "isActive" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_resubmitted_sections_history" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "resubmitted_sections_history" 
            ADD CONSTRAINT "FK_resubmitted_sections_history_application" 
            FOREIGN KEY ("applicationId") 
            REFERENCES "warehouse_operator_application_request"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "resubmitted_sections_history" 
            ADD CONSTRAINT "FK_resubmitted_sections_history_location" 
            FOREIGN KEY ("warehouseLocationId") 
            REFERENCES "warehouse_location"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "resubmitted_sections_history" 
            ADD CONSTRAINT "FK_resubmitted_sections_history_section_history" 
            FOREIGN KEY ("assignmentSectionHistoryId") 
            REFERENCES "assignment_sections_history"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "resubmitted_sections_history" 
            DROP CONSTRAINT "FK_resubmitted_sections_history_section_history"
        `);
        await queryRunner.query(`
            ALTER TABLE "resubmitted_sections_history" 
            DROP CONSTRAINT "FK_resubmitted_sections_history_location"
        `);
        await queryRunner.query(`
            ALTER TABLE "resubmitted_sections_history" 
            DROP CONSTRAINT "FK_resubmitted_sections_history_application"
        `);
        await queryRunner.query(`DROP TABLE "resubmitted_sections_history"`);
    }
}