import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeclarationHistoryTableToAllowMultipleSubmissions1766591872343 implements MigrationInterface {
    name = 'UpdateDeclarationHistoryTableToAllowMultipleSubmissions1766591872343'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" DROP CONSTRAINT "FK_ed5578672fe1e1dfc9728d1c596"`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" DROP CONSTRAINT "UQ_ed5578672fe1e1dfc9728d1c596"`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" ADD CONSTRAINT "FK_ed5578672fe1e1dfc9728d1c596" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" DROP CONSTRAINT "FK_ed5578672fe1e1dfc9728d1c596"`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" ADD CONSTRAINT "UQ_ed5578672fe1e1dfc9728d1c596" UNIQUE ("humanResourceId")`);
        await queryRunner.query(`ALTER TABLE "hr_declarations_history" ADD CONSTRAINT "FK_ed5578672fe1e1dfc9728d1c596" FOREIGN KEY ("humanResourceId") REFERENCES "human_resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
