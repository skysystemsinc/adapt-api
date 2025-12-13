import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeclarationHistoryTable1765586762773 implements MigrationInterface {
    name = 'CreateDeclarationHistoryTable1765586762773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hr_declaration_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "declarationId" uuid NOT NULL, "writeOffAvailed" character varying(10) NOT NULL, "defaultOfFinance" character varying(10) NOT NULL, "placementOnECL" character varying(10) NOT NULL, "convictionPleaBargain" character varying(10) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_373ad412398b99368cb5444907e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hr_declaration_history" ADD CONSTRAINT "FK_838efa6e10da39d727a4a6bf1b9" FOREIGN KEY ("declarationId") REFERENCES "hr_declaration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_declaration_history" DROP CONSTRAINT "FK_838efa6e10da39d727a4a6bf1b9"`);
        await queryRunner.query(`DROP TABLE "hr_declaration_history"`);
    }

}
