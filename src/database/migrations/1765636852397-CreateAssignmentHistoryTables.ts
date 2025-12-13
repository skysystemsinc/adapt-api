import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssignmentHistoryTables1765636852397 implements MigrationInterface {
    name = 'CreateAssignmentHistoryTables1765636852397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assignment_sections_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentSectionId" uuid NOT NULL, "assignmentId" uuid NOT NULL, "sectionType" character varying NOT NULL, "resourceId" uuid, "resourceType" character varying, "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2ffb3d05c1b517a791413eaa0ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_section_fields_history_status_enum" AS ENUM('PENDING', 'IN_PROCESS', 'COMPLETED', 'CORRECTIONS_REQUIRED', 'APPROVED')`);
        await queryRunner.query(`CREATE TABLE "assignment_section_fields_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentSectionFieldId" uuid NOT NULL, "assignmentSectionId" uuid NOT NULL, "fieldName" character varying NOT NULL, "remarks" text, "status" "public"."assignment_section_fields_history_status_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0c614b3126fcd7199dc0795ca8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_history_level_enum" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT', 'EXPERT_TO_HOD', 'HOD_TO_APPLICANT')`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_history_status_enum" AS ENUM('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "assignment_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentId" uuid NOT NULL, "parentAssignmentId" uuid, "applicationId" uuid, "applicationLocationId" uuid, "assignedBy" uuid, "assignedTo" uuid, "level" "public"."assignment_history_level_enum" NOT NULL, "assessmentId" uuid, "status" "public"."assignment_history_status_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9e3ec8e134976ba55ea4043b7bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment_sections_history" ADD CONSTRAINT "FK_d8b9c053348f17cc5045ab92ba5" FOREIGN KEY ("assignmentSectionId") REFERENCES "assignment_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_sections_history" ADD CONSTRAINT "FK_def5c1bd8f947045a7e390dfe75" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_section_fields_history" ADD CONSTRAINT "FK_7e8bcd87257a0217d97b6419ed7" FOREIGN KEY ("assignmentSectionFieldId") REFERENCES "assignment_section_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_section_fields_history" ADD CONSTRAINT "FK_d17e37046f449a9b4e0ab181bc4" FOREIGN KEY ("assignmentSectionId") REFERENCES "assignment_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_c19e296c04604b1259fcbd60b5c" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_1dd698e0bea69300a6e97c6cc2d" FOREIGN KEY ("parentAssignmentId") REFERENCES "assignment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_5befb6e4d6d6dc077187293517a" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_a880b908140b69054ac3219bf45" FOREIGN KEY ("applicationLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_a046a9cf46431ec5c4f96b790c6" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_a2d7b916eae9374326d57ba17b4" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_9ee744a45347f9ab4b1683a6fd2" FOREIGN KEY ("assessmentId") REFERENCES "inspection_reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_9ee744a45347f9ab4b1683a6fd2"`);
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_a2d7b916eae9374326d57ba17b4"`);
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_a046a9cf46431ec5c4f96b790c6"`);
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_a880b908140b69054ac3219bf45"`);
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_5befb6e4d6d6dc077187293517a"`);
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_1dd698e0bea69300a6e97c6cc2d"`);
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_c19e296c04604b1259fcbd60b5c"`);
        await queryRunner.query(`ALTER TABLE "assignment_section_fields_history" DROP CONSTRAINT "FK_d17e37046f449a9b4e0ab181bc4"`);
        await queryRunner.query(`ALTER TABLE "assignment_section_fields_history" DROP CONSTRAINT "FK_7e8bcd87257a0217d97b6419ed7"`);
        await queryRunner.query(`ALTER TABLE "assignment_sections_history" DROP CONSTRAINT "FK_def5c1bd8f947045a7e390dfe75"`);
        await queryRunner.query(`ALTER TABLE "assignment_sections_history" DROP CONSTRAINT "FK_d8b9c053348f17cc5045ab92ba5"`);
        await queryRunner.query(`DROP TABLE "assignment_history"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_history_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_history_level_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_section_fields_history"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_section_fields_history_status_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_sections_history"`);
    }

}
