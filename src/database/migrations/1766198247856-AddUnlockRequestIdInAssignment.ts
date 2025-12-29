import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnlockRequestIdInAssignment1766198247856 implements MigrationInterface {
    name = 'AddUnlockRequestIdInAssignment1766198247856'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" ADD "unlockRequestId" uuid`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_5d91f77af25b658dfa4df7922e9" FOREIGN KEY ("unlockRequestId") REFERENCES "unlock_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_5d91f77af25b658dfa4df7922e9"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "unlockRequestId"`);
    }

}
