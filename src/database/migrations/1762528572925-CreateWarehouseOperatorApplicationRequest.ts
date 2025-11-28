import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWarehouseOperatorApplicationRequest1762528572925 implements MigrationInterface {
    name = 'CreateWarehouseOperatorApplicationRequest1762528572925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the status enum for warehouse operator application requests
        await queryRunner.query(`
            CREATE TYPE "public"."warehouse_operator_application_request_status_enum" AS ENUM(
                'PENDING', 
                'IN_PROCESS', 
                'APPROVED', 
                'REJECTED', 
                'DRAFT', 
                'SUBMITTED'
            )
        `);

        // Create the warehouse_operator_application_request table
        await queryRunner.query(`
            CREATE TABLE "warehouse_operator_application_request" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "applicationId" character varying(20), 
                "userId" uuid, 
                "status" "public"."warehouse_operator_application_request_status_enum" NOT NULL DEFAULT 'PENDING', 
                "remarks" text, 
                "metadata" jsonb, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_b98b2292d2ddaa311612788ef7c" UNIQUE ("applicationId"), 
                CONSTRAINT "PK_12250156440a8113125f71f5357" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key to users table
        await queryRunner.query(`
            ALTER TABLE "warehouse_operator_application_request" 
            ADD CONSTRAINT "FK_7a7b84af1e84d056deeb9e3b33c" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouse_operator_application_request" DROP CONSTRAINT "FK_7a7b84af1e84d056deeb9e3b33c"`);
        await queryRunner.query(`DROP TABLE "warehouse_operator_application_request"`);
        await queryRunner.query(`DROP TYPE "public"."warehouse_operator_application_request_status_enum"`);
    }
}
