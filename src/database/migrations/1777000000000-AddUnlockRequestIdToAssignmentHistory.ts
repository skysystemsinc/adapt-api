import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnlockRequestIdToAssignmentHistory1777000000000 implements MigrationInterface {
    name = 'AddUnlockRequestIdToAssignmentHistory1777000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add unlockRequestId column to assignment_history table
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD "unlockRequestId" uuid`);
        
        // Add foreign key constraint for unlockRequestId in assignment_history
        await queryRunner.query(`ALTER TABLE "assignment_history" ADD CONSTRAINT "FK_assignment_history_unlock_request" FOREIGN KEY ("unlockRequestId") REFERENCES "unlock_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint for unlockRequestId
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP CONSTRAINT "FK_assignment_history_unlock_request"`);
        
        // Remove unlockRequestId column from assignment_history
        await queryRunner.query(`ALTER TABLE "assignment_history" DROP COLUMN "unlockRequestId"`);
    }

}

