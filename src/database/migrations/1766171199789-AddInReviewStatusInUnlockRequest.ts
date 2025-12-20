import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInReviewStatusInUnlockRequest1766171199789 implements MigrationInterface {
    name = 'AddInReviewStatusInUnlockRequest1766171199789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."unlock_requests_status_enum" RENAME TO "unlock_requests_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."unlock_requests_status_enum" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ALTER COLUMN "status" TYPE "public"."unlock_requests_status_enum" USING "status"::"text"::"public"."unlock_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."unlock_requests_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."unlock_requests_status_enum_old" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ALTER COLUMN "status" TYPE "public"."unlock_requests_status_enum_old" USING "status"::"text"::"public"."unlock_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."unlock_requests_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."unlock_requests_status_enum_old" RENAME TO "unlock_requests_status_enum"`);
    }

}
