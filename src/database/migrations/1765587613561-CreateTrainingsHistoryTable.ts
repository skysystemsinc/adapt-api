import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTrainingsHistoryTable1765587613561 implements MigrationInterface {
    name = 'CreateTrainingsHistoryTable1765587613561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_trainings_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "trainingsId" uuid NOT NULL, "trainingTitle" character varying(150) NOT NULL, "conductedBy" character varying(150) NOT NULL, "trainingType" character varying(100) NOT NULL, "durationStart" character varying(20) NOT NULL, "durationEnd" character varying(20) NOT NULL, "dateOfCompletion" character varying(20) NOT NULL, "trainingCertificate" uuid, "hrId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_07eea90577ddfd0c1f5dec5218b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hr_trainings_history" ADD CONSTRAINT "FK_38ff659dd868638d4fb30bb3746" FOREIGN KEY ("trainingsId") REFERENCES "hr_trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_trainings_history" ADD CONSTRAINT "FK_e7673343d4f556f460505491e57" FOREIGN KEY ("trainingCertificate") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr_trainings_history" ADD CONSTRAINT "FK_04cbe04f8cac6b603baff586109" FOREIGN KEY ("hrId") REFERENCES "hrs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_trainings_history" DROP CONSTRAINT "FK_04cbe04f8cac6b603baff586109"`);
        await queryRunner.query(`ALTER TABLE "hr_trainings_history" DROP CONSTRAINT "FK_e7673343d4f556f460505491e57"`);
        await queryRunner.query(`ALTER TABLE "hr_trainings_history" DROP CONSTRAINT "FK_38ff659dd868638d4fb30bb3746"`);
        await queryRunner.query(`DROP TABLE "hr_trainings_history"`);
    }

}
