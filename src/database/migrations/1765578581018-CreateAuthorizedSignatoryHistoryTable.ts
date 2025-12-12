import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthorizedSignatoryHistoryTable1765578581018 implements MigrationInterface {
    name = 'CreateAuthorizedSignatoryHistoryTable1765578581018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "authorized_signatories_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouseOperatorApplicationRequestId" uuid, "authorizedSignatoryId" uuid NOT NULL, "name" character varying(200) NOT NULL, "authorizedSignatoryName" character varying(200) NOT NULL, "cnic" character varying(100) NOT NULL, "passport" character varying(100), "issuanceDateOfCnic" date NOT NULL, "expiryDateOfCnic" date NOT NULL, "mailingAddress" text NOT NULL, "city" character varying(100) NOT NULL, "country" character varying(100) NOT NULL, "postalCode" character varying(10) NOT NULL, "designation" character varying(100) NOT NULL, "mobileNumber" character varying(50) NOT NULL, "email" character varying(100) NOT NULL, "landlineNumber" character varying(10), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86b3898a06d2bb91620ae3caf92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "authorized_signatories_history" ADD CONSTRAINT "FK_d2b34447ae7b0d36d58f5a36e64" FOREIGN KEY ("warehouseOperatorApplicationRequestId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "authorized_signatories_history" ADD CONSTRAINT "FK_a5137509c97a61828c6eaa71310" FOREIGN KEY ("authorizedSignatoryId") REFERENCES "authorized_signatories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "authorized_signatories_history" DROP CONSTRAINT "FK_a5137509c97a61828c6eaa71310"`);
        await queryRunner.query(`ALTER TABLE "authorized_signatories_history" DROP CONSTRAINT "FK_d2b34447ae7b0d36d58f5a36e64"`);
        await queryRunner.query(`DROP TABLE "authorized_signatories_history"`);
    }

}
