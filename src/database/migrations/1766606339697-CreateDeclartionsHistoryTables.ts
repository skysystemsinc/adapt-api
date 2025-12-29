import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeclartionsHistoryTables1766606339697 implements MigrationInterface {
    name = 'CreateDeclartionsHistoryTables1766606339697'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "registration_fee_checklist_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "registrationFeeChecklistId" uuid NOT NULL, "bankPaymentSlip" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_724dae919365ef0f99910cc714b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "declaration_checklist_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "declarationChecklistId" uuid NOT NULL, "informationTrueComplete" boolean NOT NULL DEFAULT false, "authorizeVerification" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicantChecklistId" uuid, CONSTRAINT "PK_6816e902f4ca40e264ea7aa3c0a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist_history" ADD CONSTRAINT "FK_80deac8864e68a87651536ea82f" FOREIGN KEY ("registrationFeeChecklistId") REFERENCES "registration_fee_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist_history" ADD CONSTRAINT "FK_9b193b81b06e0d56ef7de9aa21f" FOREIGN KEY ("bankPaymentSlip") REFERENCES "warehouse_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist_history" ADD CONSTRAINT "FK_8423b8092be46dec8be05ab5858" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "declaration_checklist_history" ADD CONSTRAINT "FK_a82c13b849b27c1958734e3f26d" FOREIGN KEY ("declarationChecklistId") REFERENCES "declaration_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "declaration_checklist_history" ADD CONSTRAINT "FK_b48111e70b7d692d54f3900be65" FOREIGN KEY ("applicantChecklistId") REFERENCES "applicant_checklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "declaration_checklist_history" DROP CONSTRAINT "FK_b48111e70b7d692d54f3900be65"`);
        await queryRunner.query(`ALTER TABLE "declaration_checklist_history" DROP CONSTRAINT "FK_a82c13b849b27c1958734e3f26d"`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist_history" DROP CONSTRAINT "FK_8423b8092be46dec8be05ab5858"`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist_history" DROP CONSTRAINT "FK_9b193b81b06e0d56ef7de9aa21f"`);
        await queryRunner.query(`ALTER TABLE "registration_fee_checklist_history" DROP CONSTRAINT "FK_80deac8864e68a87651536ea82f"`);
        await queryRunner.query(`DROP TABLE "declaration_checklist_history"`);
        await queryRunner.query(`DROP TABLE "registration_fee_checklist_history"`);
    }

}
