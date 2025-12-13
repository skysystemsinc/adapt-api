import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApplicantChecklistHistoryTables1765642153987 implements MigrationInterface {
    name = 'CreateApplicantChecklistHistoryTables1765642153987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "applicant_checklist_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicantChecklistId" uuid NOT NULL, "applicationId" uuid, "humanResourcesId" uuid, "financialSoundnessId" uuid, "registrationFeeId" uuid, "declarationId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_30b40cb5cdf23754f66b8d76cd" UNIQUE ("humanResourcesId"), CONSTRAINT "REL_3ca6ffe334456aeea5609e938f" UNIQUE ("financialSoundnessId"), CONSTRAINT "REL_c50561fab9b9fd2af63b08659e" UNIQUE ("registrationFeeId"), CONSTRAINT "REL_6fe5c9b3a4358bfb37bf8d1f9d" UNIQUE ("declarationId"), CONSTRAINT "PK_331a1ae734e288343ae38873a2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" ADD CONSTRAINT "FK_2af4d38945173c27a3a477bc1b9" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" ADD CONSTRAINT "FK_22128b4579b3dbcd94828f704b1" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" ADD CONSTRAINT "FK_30b40cb5cdf23754f66b8d76cda" FOREIGN KEY ("humanResourcesId") REFERENCES "human_resources_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" ADD CONSTRAINT "FK_3ca6ffe334456aeea5609e938f6" FOREIGN KEY ("financialSoundnessId") REFERENCES "financial_soundness_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" ADD CONSTRAINT "FK_c50561fab9b9fd2af63b08659e8" FOREIGN KEY ("registrationFeeId") REFERENCES "registration_fee_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" ADD CONSTRAINT "FK_6fe5c9b3a4358bfb37bf8d1f9de" FOREIGN KEY ("declarationId") REFERENCES "declaration_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" DROP CONSTRAINT "FK_6fe5c9b3a4358bfb37bf8d1f9de"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" DROP CONSTRAINT "FK_c50561fab9b9fd2af63b08659e8"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" DROP CONSTRAINT "FK_3ca6ffe334456aeea5609e938f6"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" DROP CONSTRAINT "FK_30b40cb5cdf23754f66b8d76cda"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" DROP CONSTRAINT "FK_22128b4579b3dbcd94828f704b1"`);
        await queryRunner.query(`ALTER TABLE "applicant_checklist_history" DROP CONSTRAINT "FK_2af4d38945173c27a3a477bc1b9"`);
        await queryRunner.query(`DROP TABLE "applicant_checklist_history"`);
    }

}
