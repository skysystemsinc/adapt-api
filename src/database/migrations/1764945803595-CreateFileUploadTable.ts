import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFileUploadTable1764945803595 implements MigrationInterface {
    name = 'CreateFileUploadTable1764945803595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "file_uploads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filePath" text NOT NULL, "iv" text NOT NULL, "authTag" text NOT NULL, "originalName" text, "mimeType" text, "size" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a1c76afe16cfcdfee73bf505c14" UNIQUE ("filePath"), CONSTRAINT "PK_b3ebfc99a8b660f0bc64a052b42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a1c76afe16cfcdfee73bf505c1" ON "file_uploads" ("filePath") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_a1c76afe16cfcdfee73bf505c1"`);
        await queryRunner.query(`DROP TABLE "file_uploads"`);
    }

}
