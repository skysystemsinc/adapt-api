import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRegistrationApplicationTables1761149096335 implements MigrationInterface {
    name = 'CreateRegistrationApplicationTables1761149096335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "registration_application" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."registration_application_status_enum" NOT NULL DEFAULT 'PENDING', "ipAddress" character varying, "userAgent" text, "referrer" character varying, "metadata" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicationTypeId" uuid, CONSTRAINT "REL_5ce51bfeedd4654c6cbd1b563a" UNIQUE ("applicationTypeId"), CONSTRAINT "PK_16f726f239d22e8fe361bbc54fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "registration_application_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" text NOT NULL, "status" "public"."registration_application_details_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "applicationId" uuid, CONSTRAINT "PK_2e7197076287e6e5a6e3272680d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD CONSTRAINT "FK_5ce51bfeedd4654c6cbd1b563a9" FOREIGN KEY ("applicationTypeId") REFERENCES "application_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_application_details" ADD CONSTRAINT "FK_fd651d49f57fb3308b55927d9a5" FOREIGN KEY ("applicationId") REFERENCES "registration_application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_application_details" DROP CONSTRAINT "FK_fd651d49f57fb3308b55927d9a5"`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP CONSTRAINT "FK_5ce51bfeedd4654c6cbd1b563a9"`);
        await queryRunner.query(`DROP TABLE "registration_application_details"`);
        await queryRunner.query(`DROP TABLE "registration_application"`);
    }

}
