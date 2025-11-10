import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthorizedSignatoriesTable1762530264901 implements MigrationInterface {
    name = 'CreateAuthorizedSignatoriesTable1762530264901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "authorized_signatories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "warehouseOperatorApplicationRequestId" uuid, "name" character varying(200) NOT NULL, "cnic" character varying(100) NOT NULL, "passport" character varying(100), "issuanceDateOfCnic" date NOT NULL, "expiryDateOfCnic" date NOT NULL, "mailingAddress" text NOT NULL, "city" character varying(100) NOT NULL, "country" character varying(100) NOT NULL, "postalCode" character varying(10) NOT NULL, "designation" character varying(100) NOT NULL, "mobileNumber" character varying(50) NOT NULL, "email" character varying(100) NOT NULL, "landlineNumber" character varying(10), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4db1b7a9c333e88b4a2e997daa4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" ADD "applicationType" text`);
        await queryRunner.query(`ALTER TABLE "authorized_signatories" ADD CONSTRAINT "FK_d66cfee747d81acbfd4517a699d" FOREIGN KEY ("warehouseOperatorApplicationRequestId") REFERENCES "warehouse_operator_application_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "authorized_signatories" DROP CONSTRAINT "FK_d66cfee747d81acbfd4517a699d"`);
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" DROP COLUMN "applicationType"`);
        await queryRunner.query(`DROP TABLE "authorized_signatories"`);
    }

}
