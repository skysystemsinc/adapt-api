import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateresubmittedSectionsTable1765631795117 implements MigrationInterface {
    name = 'CreateresubmittedSectionsTable1765631795117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "resubmitted_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "warehouseLocationId" uuid, "assignmentSectionId" uuid, "sectionType" character varying NOT NULL, "resourceId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1d7e679a2c4b1e4fc5189298507" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "resubmitted_sections" ADD CONSTRAINT "FK_6248a0d9bc6ebfed4df67c82594" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resubmitted_sections" ADD CONSTRAINT "FK_daa0a68bb64027773aa4acba0e0" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resubmitted_sections" ADD CONSTRAINT "FK_4b3e2933c1f0222696cf9bfd3cb" FOREIGN KEY ("assignmentSectionId") REFERENCES "assignment_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resubmitted_sections" DROP CONSTRAINT "FK_4b3e2933c1f0222696cf9bfd3cb"`);
        await queryRunner.query(`ALTER TABLE "resubmitted_sections" DROP CONSTRAINT "FK_daa0a68bb64027773aa4acba0e0"`);
        await queryRunner.query(`ALTER TABLE "resubmitted_sections" DROP CONSTRAINT "FK_6248a0d9bc6ebfed4df67c82594"`);
        await queryRunner.query(`DROP TABLE "resubmitted_sections"`);
    }

}
