import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStatusEnumInWarehouseOperatorApplication1763558335352 implements MigrationInterface {
    name = 'UpdateStatusEnumInWarehouseOperatorApplication1763558335352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."warehouse_operator_application_request_status_enum" RENAME TO "warehouse_operator_application_request_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operator_application_request_status_enum" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED', 'RESUBMITTED', 'SENT_TO_HOD')`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" TYPE "public"."warehouse_operator_application_request_status_enum" USING "status"::"text"::"public"."warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_application_request_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."warehouse_operator_application_request_status_enum_old" AS ENUM('PENDING', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'DRAFT', 'SUBMITTED', 'RESUBMITTED')`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" TYPE "public"."warehouse_operator_application_request_status_enum_old" USING "status"::"text"::"public"."warehouse_operator_application_request_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_application_request_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."warehouse_operator_application_request_status_enum_old" RENAME TO "warehouse_operator_application_request_status_enum"`);
    }

}
