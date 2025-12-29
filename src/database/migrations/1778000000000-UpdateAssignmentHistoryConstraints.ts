import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAssignmentHistoryConstraints1778000000000 implements MigrationInterface {
    name = 'UpdateAssignmentHistoryConstraints1778000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ============================================
        // Update assignment_history table
        // ============================================
        
        // Drop the existing CASCADE constraint if it exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_history' 
                    AND constraint_name='FK_c19e296c04604b1259fcbd60b5c'
                ) THEN
                    ALTER TABLE "assignment_history" 
                    DROP CONSTRAINT "FK_c19e296c04604b1259fcbd60b5c";
                END IF;
            END
            $$;
        `);

        // Make assignmentId nullable (safe to run multiple times)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='assignment_history' 
                    AND column_name='assignmentId'
                    AND is_nullable='NO'
                ) THEN
                    ALTER TABLE "assignment_history" 
                    ALTER COLUMN "assignmentId" DROP NOT NULL;
                END IF;
            END
            $$;
        `);

        // Add new constraint with SET NULL (only if it doesn't exist)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_history' 
                    AND constraint_name='FK_c19e296c04604b1259fcbd60b5c'
                ) THEN
                    ALTER TABLE "assignment_history" 
                    ADD CONSTRAINT "FK_c19e296c04604b1259fcbd60b5c" 
                    FOREIGN KEY ("assignmentId") 
                    REFERENCES "assignment"("id") 
                    ON DELETE SET NULL ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);

        // ============================================
        // Update assignment_section_fields_history table
        // ============================================
        
        // Drop existing constraint if it exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_section_fields_history' 
                    AND constraint_name='FK_7e8bcd87257a0217d97b6419ed7'
                ) THEN
                    ALTER TABLE "assignment_section_fields_history" 
                    DROP CONSTRAINT "FK_7e8bcd87257a0217d97b6419ed7";
                END IF;
            END
            $$;
        `);

        // Make assignmentSectionFieldId nullable (safe to run multiple times)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='assignment_section_fields_history' 
                    AND column_name='assignmentSectionFieldId'
                    AND is_nullable='NO'
                ) THEN
                    ALTER TABLE "assignment_section_fields_history" 
                    ALTER COLUMN "assignmentSectionFieldId" DROP NOT NULL;
                END IF;
            END
            $$;
        `);

        // Add new constraint with SET NULL (only if it doesn't exist)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_section_fields_history' 
                    AND constraint_name='FK_7e8bcd87257a0217d97b6419ed7'
                ) THEN
                    ALTER TABLE "assignment_section_fields_history" 
                    ADD CONSTRAINT "FK_7e8bcd87257a0217d97b6419ed7" 
                    FOREIGN KEY ("assignmentSectionFieldId") 
                    REFERENCES "assignment_section_fields"("id") 
                    ON DELETE SET NULL ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert assignment_history changes
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_history' 
                    AND constraint_name='FK_c19e296c04604b1259fcbd60b5c'
                ) THEN
                    ALTER TABLE "assignment_history" 
                    DROP CONSTRAINT "FK_c19e296c04604b1259fcbd60b5c";
                END IF;
            END
            $$;
        `);

        // Make assignmentId NOT NULL again (only if it's currently nullable)
        // Note: This will fail if there are NULL values - handle with care
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='assignment_history' 
                    AND column_name='assignmentId'
                    AND is_nullable='YES'
                ) THEN
                    -- Check if there are any NULL values
                    IF EXISTS (SELECT 1 FROM "assignment_history" WHERE "assignmentId" IS NULL) THEN
                        RAISE EXCEPTION 'Cannot revert: assignment_history contains NULL assignmentId values';
                    END IF;
                    
                    ALTER TABLE "assignment_history" 
                    ALTER COLUMN "assignmentId" SET NOT NULL;
                END IF;
            END
            $$;
        `);

        // Restore CASCADE constraint
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_history' 
                    AND constraint_name='FK_c19e296c04604b1259fcbd60b5c'
                ) THEN
                    ALTER TABLE "assignment_history" 
                    ADD CONSTRAINT "FK_c19e296c04604b1259fcbd60b5c" 
                    FOREIGN KEY ("assignmentId") 
                    REFERENCES "assignment"("id") 
                    ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);

        // Revert assignment_section_fields_history changes
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_section_fields_history' 
                    AND constraint_name='FK_7e8bcd87257a0217d97b6419ed7'
                ) THEN
                    ALTER TABLE "assignment_section_fields_history" 
                    DROP CONSTRAINT "FK_7e8bcd87257a0217d97b6419ed7";
                END IF;
            END
            $$;
        `);

        // Make assignmentSectionFieldId NOT NULL again (only if it's currently nullable)
        // Note: This will fail if there are NULL values - handle with care
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='assignment_section_fields_history' 
                    AND column_name='assignmentSectionFieldId'
                    AND is_nullable='YES'
                ) THEN
                    -- Check if there are any NULL values
                    IF EXISTS (SELECT 1 FROM "assignment_section_fields_history" WHERE "assignmentSectionFieldId" IS NULL) THEN
                        RAISE EXCEPTION 'Cannot revert: assignment_section_fields_history contains NULL assignmentSectionFieldId values';
                    END IF;
                    
                    ALTER TABLE "assignment_section_fields_history" 
                    ALTER COLUMN "assignmentSectionFieldId" SET NOT NULL;
                END IF;
            END
            $$;
        `);

        // Restore CASCADE constraint
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE table_name='assignment_section_fields_history' 
                    AND constraint_name='FK_7e8bcd87257a0217d97b6419ed7'
                ) THEN
                    ALTER TABLE "assignment_section_fields_history" 
                    ADD CONSTRAINT "FK_7e8bcd87257a0217d97b6419ed7" 
                    FOREIGN KEY ("assignmentSectionFieldId") 
                    REFERENCES "assignment_section_fields"("id") 
                    ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    }
}

