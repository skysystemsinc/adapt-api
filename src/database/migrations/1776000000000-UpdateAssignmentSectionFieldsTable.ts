import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAssignmentSectionFieldsTable1776000000000 implements MigrationInterface {
    name = 'UpdateAssignmentSectionFieldsTable1776000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add assignmentSectionHistoryId column to assignment_section_fields table
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" ADD "assignmentSectionHistoryId" uuid`);
        
        // Add foreign key constraint for assignmentSectionHistoryId
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" ADD CONSTRAINT "FK_assignment_section_fields_history" FOREIGN KEY ("assignmentSectionHistoryId") REFERENCES "assignment_sections_history"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        
        // Make assignmentSectionId nullable to match entity definition
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" ALTER COLUMN "assignmentSectionId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" DROP CONSTRAINT "FK_assignment_section_fields_history"`);
        
        // Remove assignmentSectionHistoryId column
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" DROP COLUMN "assignmentSectionHistoryId"`);
        
        // Revert assignmentSectionId to NOT NULL
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" ALTER COLUMN "assignmentSectionId" SET NOT NULL`);
    }

}

