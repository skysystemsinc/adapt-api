import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUnlockRequestTable1765909046495 implements MigrationInterface {
    name = 'CreateUnlockRequestTable1765909046495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."unlock_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "unlock_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "operatorId" uuid, "locationId" uuid, "userId" uuid NOT NULL, "remarks" text NOT NULL, "bankPaymentSlip" character varying(500) NOT NULL, "iv" character varying(255), "authTag" character varying(255), "status" "public"."unlock_requests_status_enum" NOT NULL DEFAULT 'PENDING', "reviewedBy" uuid, "reviewedAt" date, "reviewRemarks" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8e34ef27b2ba6da9f3d71a1cbf0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ADD CONSTRAINT "FK_edcbd554bc174e83ddf29e9b35b" FOREIGN KEY ("operatorId") REFERENCES "warehouse_operators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ADD CONSTRAINT "FK_146036c34e558295598256f55bb" FOREIGN KEY ("locationId") REFERENCES "warehouse_operator_locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ADD CONSTRAINT "FK_10fd649e88511ded9ffd9200069" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" ADD CONSTRAINT "FK_8601b6321b9f230164fbe7881ee" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "unlock_requests" DROP CONSTRAINT "FK_8601b6321b9f230164fbe7881ee"`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" DROP CONSTRAINT "FK_10fd649e88511ded9ffd9200069"`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" DROP CONSTRAINT "FK_146036c34e558295598256f55bb"`);
        await queryRunner.query(`ALTER TABLE "unlock_requests" DROP CONSTRAINT "FK_edcbd554bc174e83ddf29e9b35b"`);
        await queryRunner.query(`DROP TABLE "unlock_requests"`);
        await queryRunner.query(`DROP TYPE "public"."unlock_requests_status_enum"`);
    }

}
