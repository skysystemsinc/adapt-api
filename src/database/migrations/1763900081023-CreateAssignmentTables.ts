import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssignmentTables1763900081023 implements MigrationInterface {
    name = 'CreateAssignmentTables1763900081023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assignment_section_fields_status_enum" AS ENUM('PENDING', 'IN_PROCESS', 'COMPLETED', 'CORRECTIONS_REQUIRED', 'APPROVED')`);
        await queryRunner.query(`CREATE TABLE "assignment_section_fields" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentSectionId" uuid NOT NULL, "fieldName" character varying NOT NULL, "remarks" text, "status" "public"."assignment_section_fields_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eb8bad7539fc878033691791ddd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignmentId" uuid NOT NULL, "sectionType" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4cb2abcb719b95e3279d4337d7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_level_enum" AS ENUM('OFFICER_TO_HOD', 'HOD_TO_EXPERT')`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_status_enum" AS ENUM('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "assignment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "assignedBy" uuid, "assignedTo" uuid, "level" "public"."assignment_level_enum" NOT NULL, "status" "public"."assignment_status_enum" NOT NULL DEFAULT 'ASSIGNED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "parentAssignmentId" uuid, CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" ADD CONSTRAINT "FK_5e2c6e78221ca7ef4384ca2783d" FOREIGN KEY ("assignmentSectionId") REFERENCES "assignment_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_sections" ADD CONSTRAINT "FK_2b9e997c4c259328fe80f6683e9" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_346db95da0e2ea1cf96c42e1ccc" FOREIGN KEY ("parentAssignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_f272559e93859f6f8761285bbf0" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_6cfe8846c8aa31ed3c4365d7b9a" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_6715e42e6c3177352a585ff2a5f" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_6715e42e6c3177352a585ff2a5f"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_6cfe8846c8aa31ed3c4365d7b9a"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_f272559e93859f6f8761285bbf0"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_346db95da0e2ea1cf96c42e1ccc"`);
        await queryRunner.query(`ALTER TABLE "assignment_sections" DROP CONSTRAINT "FK_2b9e997c4c259328fe80f6683e9"`);
        await queryRunner.query(`ALTER TABLE "assignment_section_fields" DROP CONSTRAINT "FK_5e2c6e78221ca7ef4384ca2783d"`);
        await queryRunner.query(`DROP TABLE "assignment"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_level_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_sections"`);
        await queryRunner.query(`DROP TABLE "assignment_section_fields"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_section_fields_status_enum"`);
    }

}
