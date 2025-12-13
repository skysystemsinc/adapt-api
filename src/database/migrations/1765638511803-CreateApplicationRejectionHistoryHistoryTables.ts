import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApplicationRejectionHistoryHistoryTables1765638511803 implements MigrationInterface {
    name = 'CreateApplicationRejectionHistoryHistoryTables1765638511803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "application_rejection_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid, "locationApplicationId" uuid, "rejectionReason" character varying, "rejectionBy" uuid, "unlockedSections" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2cb2554d22ccedb5328da74ccaf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "application_rejection_history" ADD CONSTRAINT "FK_cdc492800a7f147fb3cf0651293" FOREIGN KEY ("applicationId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_rejection_history" ADD CONSTRAINT "FK_afa5c2e82bf648ff696a805fa2d" FOREIGN KEY ("locationApplicationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_rejection_history" ADD CONSTRAINT "FK_aec095af86198ca2dff2c233ab0" FOREIGN KEY ("rejectionBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_rejection_history" DROP CONSTRAINT "FK_aec095af86198ca2dff2c233ab0"`);
        await queryRunner.query(`ALTER TABLE "application_rejection_history" DROP CONSTRAINT "FK_afa5c2e82bf648ff696a805fa2d"`);
        await queryRunner.query(`ALTER TABLE "application_rejection_history" DROP CONSTRAINT "FK_cdc492800a7f147fb3cf0651293"`);
        await queryRunner.query(`DROP TABLE "application_rejection_history"`);
    }

}
