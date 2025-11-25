import { MigrationInterface, QueryRunner } from "typeorm";

export class ExperienceResponsibilitiesNullable1764084476033 implements MigrationInterface {
    name = 'ExperienceResponsibilitiesNullable1764084476033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "professional_experiences" ALTER COLUMN "responsibilities" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "professional_experiences" ALTER COLUMN "responsibilities" SET NOT NULL`);
    }

}
