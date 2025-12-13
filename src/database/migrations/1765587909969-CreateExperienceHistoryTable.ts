import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExperienceHistoryTable1765587909969 implements MigrationInterface {
    name = 'CreateExperienceHistoryTable1765587909969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_experience_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "experienceId" uuid NOT NULL, "positionHeld" character varying(150) NOT NULL, "organizationName" character varying(180) NOT NULL, "organizationAddress" character varying(255) NOT NULL, "natureOfOrganization" character varying(120) NOT NULL, "dateOfAppointment" character varying(20) NOT NULL, "dateOfLeaving" character varying(20), "duration" character varying(50), "responsibilities" text, "experienceLetter" uuid, "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6cfd57b85bab3e18bc981bf890c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hr_experience_history" ADD CONSTRAINT "FK_87a6bfbcaea8c1170674b5ff4ce" FOREIGN KEY ("experienceId") REFERENCES "hr_experience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_experience_history" ADD CONSTRAINT "FK_0d4a07d2ebcd4129c0cda5eb697" FOREIGN KEY ("experienceLetter") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_experience_history" ADD CONSTRAINT "FK_dad2199b1e1ac42269f66a17c0a" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_experience_history" DROP CONSTRAINT "FK_dad2199b1e1ac42269f66a17c0a"`);
        await queryRunner.query(`ALTER TABLE "hr_experience_history" DROP CONSTRAINT "FK_0d4a07d2ebcd4129c0cda5eb697"`);
        await queryRunner.query(`ALTER TABLE "hr_experience_history" DROP CONSTRAINT "FK_87a6bfbcaea8c1170674b5ff4ce"`);
        await queryRunner.query(`DROP TABLE "hr_experience_history"`);
    }

}
