import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAssignmentHistoryRelations1766754379675 implements MigrationInterface {
    name = 'UpdateAssignmentHistoryRelations1766754379675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ============================================
        // Update assignment_sections_history table
        // ============================================
        
        // Check if assignmentHistoryId column exists, if not add it
        const hasAssignmentHistoryId = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='assignment_sections_history' 
            AND column_name='assignmentHistoryId'
        `);

        if (hasAssignmentHistoryId.length === 0) {
            // Add assignmentHistoryId column
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                ADD COLUMN "assignmentHistoryId" uuid
            `);
        }

        // Check if assignmentId column exists (old column)
        const hasAssignmentId = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='assignment_sections_history' 
            AND column_name='assignmentId'
        `);

        if (hasAssignmentId.length > 0) {
            // Drop old foreign key if it exists
            const oldFkExists = await queryRunner.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name='assignment_sections_history' 
                AND constraint_name='FK_def5c1bd8f947045a7e390dfe75'
            `);

            if (oldFkExists.length > 0) {
                await queryRunner.query(`
                    ALTER TABLE "assignment_sections_history" 
                    DROP CONSTRAINT "FK_def5c1bd8f947045a7e390dfe75"
                `);
            }

            // Make assignmentId nullable (for backward compatibility)
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                ALTER COLUMN "assignmentId" DROP NOT NULL
            `);
        }

        // Add foreign key for assignmentHistoryId if it doesn't exist
        const newFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_sections_history' 
            AND constraint_name='FK_assignment_sections_history_assignment_history'
        `);

        if (newFkExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                ADD CONSTRAINT "FK_assignment_sections_history_assignment_history" 
                FOREIGN KEY ("assignmentHistoryId") 
                REFERENCES "assignment_history"("id") 
                ON DELETE SET NULL ON UPDATE NO ACTION
            `);
        }

        // Make assignmentSectionId nullable if it's not already
        await queryRunner.query(`
            ALTER TABLE "assignment_sections_history" 
            ALTER COLUMN "assignmentSectionId" DROP NOT NULL
        `);

        // Update foreign key for assignmentSectionId to SET NULL
        const sectionFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_sections_history' 
            AND constraint_name='FK_d8b9c053348f17cc5045ab92ba5'
        `);

        if (sectionFkExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                DROP CONSTRAINT "FK_d8b9c053348f17cc5045ab92ba5"
            `);

            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                ADD CONSTRAINT "FK_d8b9c053348f17cc5045ab92ba5" 
                FOREIGN KEY ("assignmentSectionId") 
                REFERENCES "assignment_sections"("id") 
                ON DELETE SET NULL ON UPDATE NO ACTION
            `);
        }

        // ============================================
        // Update assignment_section_fields_history table
        // ============================================

        // Add assignmentSectionHistoryId column if it doesn't exist
        const hasFieldHistoryId = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='assignment_section_fields_history' 
            AND column_name='assignmentSectionHistoryId'
        `);

        if (hasFieldHistoryId.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                ADD COLUMN "assignmentSectionHistoryId" uuid
            `);
        }

        // Make assignmentSectionId nullable if it's not already
        await queryRunner.query(`
            ALTER TABLE "assignment_section_fields_history" 
            ALTER COLUMN "assignmentSectionId" DROP NOT NULL
        `);

        // Update foreign key for assignmentSectionId to SET NULL
        const fieldSectionFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_section_fields_history' 
            AND constraint_name='FK_d17e37046f449a9b4e0ab181bc4'
        `);

        if (fieldSectionFkExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                DROP CONSTRAINT "FK_d17e37046f449a9b4e0ab181bc4"
            `);

            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                ADD CONSTRAINT "FK_d17e37046f449a9b4e0ab181bc4" 
                FOREIGN KEY ("assignmentSectionId") 
                REFERENCES "assignment_sections"("id") 
                ON DELETE SET NULL ON UPDATE NO ACTION
            `);
        }

        // Add foreign key for assignmentSectionHistoryId if it doesn't exist
        const fieldHistoryFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_section_fields_history' 
            AND constraint_name='FK_assignment_section_fields_history_section_history'
        `);

        if (fieldHistoryFkExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                ADD CONSTRAINT "FK_assignment_section_fields_history_section_history" 
                FOREIGN KEY ("assignmentSectionHistoryId") 
                REFERENCES "assignment_sections_history"("id") 
                ON DELETE SET NULL ON UPDATE NO ACTION
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // ============================================
        // Revert assignment_section_fields_history table
        // ============================================

        // Drop foreign key for assignmentSectionHistoryId
        const fieldHistoryFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_section_fields_history' 
            AND constraint_name='FK_assignment_section_fields_history_section_history'
        `);

        if (fieldHistoryFkExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                DROP CONSTRAINT "FK_assignment_section_fields_history_section_history"
            `);
        }

        // Revert foreign key for assignmentSectionId to CASCADE
        const fieldSectionFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_section_fields_history' 
            AND constraint_name='FK_d17e37046f449a9b4e0ab181bc4'
        `);

        if (fieldSectionFkExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                DROP CONSTRAINT "FK_d17e37046f449a9b4e0ab181bc4"
            `);

            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                ADD CONSTRAINT "FK_d17e37046f449a9b4e0ab181bc4" 
                FOREIGN KEY ("assignmentSectionId") 
                REFERENCES "assignment_sections"("id") 
                ON DELETE CASCADE ON UPDATE NO ACTION
            `);
        }

        // Make assignmentSectionId NOT NULL
        await queryRunner.query(`
            ALTER TABLE "assignment_section_fields_history" 
            ALTER COLUMN "assignmentSectionId" SET NOT NULL
        `);

        // Drop assignmentSectionHistoryId column
        const hasFieldHistoryId = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='assignment_section_fields_history' 
            AND column_name='assignmentSectionHistoryId'
        `);

        if (hasFieldHistoryId.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_section_fields_history" 
                DROP COLUMN "assignmentSectionHistoryId"
            `);
        }

        // ============================================
        // Revert assignment_sections_history table
        // ============================================

        // Revert foreign key for assignmentSectionId to CASCADE
        const sectionFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_sections_history' 
            AND constraint_name='FK_d8b9c053348f17cc5045ab92ba5'
        `);

        if (sectionFkExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                DROP CONSTRAINT "FK_d8b9c053348f17cc5045ab92ba5"
            `);

            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                ADD CONSTRAINT "FK_d8b9c053348f17cc5045ab92ba5" 
                FOREIGN KEY ("assignmentSectionId") 
                REFERENCES "assignment_sections"("id") 
                ON DELETE CASCADE ON UPDATE NO ACTION
            `);
        }

        // Make assignmentSectionId NOT NULL
        await queryRunner.query(`
            ALTER TABLE "assignment_sections_history" 
            ALTER COLUMN "assignmentSectionId" SET NOT NULL
        `);

        // Drop foreign key for assignmentHistoryId
        const newFkExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='assignment_sections_history' 
            AND constraint_name='FK_assignment_sections_history_assignment_history'
        `);

        if (newFkExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                DROP CONSTRAINT "FK_assignment_sections_history_assignment_history"
            `);
        }

        // Restore old foreign key for assignmentId if it was dropped
        const hasAssignmentId = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='assignment_sections_history' 
            AND column_name='assignmentId'
        `);

        if (hasAssignmentId.length > 0) {
            const oldFkExists = await queryRunner.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name='assignment_sections_history' 
                AND constraint_name='FK_def5c1bd8f947045a7e390dfe75'
            `);

            if (oldFkExists.length === 0) {
                await queryRunner.query(`
                    ALTER TABLE "assignment_sections_history" 
                    ADD CONSTRAINT "FK_def5c1bd8f947045a7e390dfe75" 
                    FOREIGN KEY ("assignmentId") 
                    REFERENCES "assignment"("id") 
                    ON DELETE CASCADE ON UPDATE NO ACTION
                `);
            }

            // Make assignmentId NOT NULL
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                ALTER COLUMN "assignmentId" SET NOT NULL
            `);
        }

        // Drop assignmentHistoryId column
        const hasAssignmentHistoryId = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='assignment_sections_history' 
            AND column_name='assignmentHistoryId'
        `);

        if (hasAssignmentHistoryId.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "assignment_sections_history" 
                DROP COLUMN "assignmentHistoryId"
            `);
        }
    }
}

