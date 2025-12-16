import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSettingRequestTable1765824721862 implements MigrationInterface {
    name = 'CreateSettingRequestTable1765824721862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."setting_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "setting_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "settingId" uuid, "key" character varying NOT NULL, "value" text NOT NULL, "iv" text, "authTag" text, "mimeType" text, "originalName" text, "status" "public"."setting_requests_status_enum" NOT NULL DEFAULT 'pending', "action" character varying NOT NULL DEFAULT 'update', "requestedBy" uuid, "reviewedBy" uuid, "reviewedAt" TIMESTAMP, "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_69a63ee7c21b234e07b7fbf7551" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "setting_requests"`);
        await queryRunner.query(`DROP TYPE "public"."setting_requests_status_enum"`);
    }

}
