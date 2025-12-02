import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApplicationLocationIdInAssignmentTable1764692843031 implements MigrationInterface {
    name = 'AddApplicationLocationIdInAssignmentTable1764692843031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "financial_others" DROP CONSTRAINT "FK_financial_others_document"`);
        await queryRunner.query(`ALTER TABLE "form_fields_requests" DROP CONSTRAINT "FK_form_fields_requests_formRequestId"`);
        await queryRunner.query(`ALTER TABLE "form_requests" DROP CONSTRAINT "FK_form_requests_formId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forms_isActive"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forms_version"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_form_fields_requests_formRequestId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_form_fields_requests_fieldKey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_form_fields_requests_action"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_form_requests_formId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_form_requests_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_form_requests_slug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_form_requests_requestedBy"`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD "applicationLocationId" uuid`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_458d532da8be03a5b7865f7e000" FOREIGN KEY ("applicationLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_458d532da8be03a5b7865f7e000"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "applicationLocationId"`);
        await queryRunner.query(`CREATE INDEX "IDX_form_requests_requestedBy" ON "form_requests" ("requestedBy") `);
        await queryRunner.query(`CREATE INDEX "IDX_form_requests_slug" ON "form_requests" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_form_requests_status" ON "form_requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_form_requests_formId" ON "form_requests" ("formId") `);
        await queryRunner.query(`CREATE INDEX "IDX_form_fields_requests_action" ON "form_fields_requests" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_form_fields_requests_fieldKey" ON "form_fields_requests" ("fieldKey") `);
        await queryRunner.query(`CREATE INDEX "IDX_form_fields_requests_formRequestId" ON "form_fields_requests" ("formRequestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_forms_version" ON "forms" ("version") `);
        await queryRunner.query(`CREATE INDEX "IDX_forms_isActive" ON "forms" ("isActive") `);
        await queryRunner.query(`ALTER TABLE "form_requests" ADD CONSTRAINT "FK_form_requests_formId" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_fields_requests" ADD CONSTRAINT "FK_form_fields_requests_formRequestId" FOREIGN KEY ("formRequestId") REFERENCES "form_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "financial_others" ADD CONSTRAINT "FK_financial_others_document" FOREIGN KEY ("document") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
