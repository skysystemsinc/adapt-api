import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToRegistrationApplicationTable1763490989808 implements MigrationInterface {
    name = 'AddUserIdToRegistrationApplicationTable1763490989808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_application" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD CONSTRAINT "UQ_79bad6b8ec15830e8d666eaf05d" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "registration_application" ADD CONSTRAINT "FK_79bad6b8ec15830e8d666eaf05d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_application" DROP CONSTRAINT "FK_79bad6b8ec15830e8d666eaf05d"`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP CONSTRAINT "UQ_79bad6b8ec15830e8d666eaf05d"`);
        await queryRunner.query(`ALTER TABLE "registration_application" DROP COLUMN "userId"`);
    }

}
