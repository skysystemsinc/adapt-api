import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentToFinancialOthers1762999999999 implements MigrationInterface {
    name = 'AddDocumentToFinancialOthers1762999999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add column if not exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'financial_others' 
                    AND column_name = 'document'
                ) THEN
                    ALTER TABLE "financial_others" ADD "document" uuid;
                END IF;
            END
            $$;
        `);

        // Add foreign key only if it does not exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_financial_others_document'
                ) THEN
                    ALTER TABLE "financial_others" 
                    ADD CONSTRAINT "FK_financial_others_document" 
                    FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") 
                    ON DELETE SET NULL ON UPDATE NO ACTION;
                END IF;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_financial_others_document'
                ) THEN
                    ALTER TABLE "financial_others" DROP CONSTRAINT "FK_financial_others_document";
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'financial_others' 
                    AND column_name = 'document'
                ) THEN
                    ALTER TABLE "financial_others" DROP COLUMN "document";
                END IF;
            END
            $$;
        `);
    }
}
