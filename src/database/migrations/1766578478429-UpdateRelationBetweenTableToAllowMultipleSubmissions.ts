import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRelationBetweenTableToAllowMultipleSubmissions1766578478429 implements MigrationInterface {
    name = 'UpdateRelationBetweenTableToAllowMultipleSubmissions1766578478429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing_history" DROP CONSTRAINT "FK_70b1f283730c20f6dde9fde6b21"`);
        await queryRunner.query(`ALTER TABLE "security_history" DROP CONSTRAINT "FK_022e8d2fc65553fb7470c3cf3cd"`);
        await queryRunner.query(`ALTER TABLE "jurisdiction_history" DROP CONSTRAINT "FK_10313eb74a5f7c95770b0c27d03"`);
        await queryRunner.query(`ALTER TABLE "fire_safety_history" DROP CONSTRAINT "FK_26366890b5ae02523c8bb61e510"`);
        await queryRunner.query(`ALTER TABLE "contact_history" DROP CONSTRAINT "FK_0c3dc8902a378fab9b3fe15d818"`);
        await queryRunner.query(`ALTER TABLE "weighing_history" DROP CONSTRAINT "REL_70b1f283730c20f6dde9fde6b2"`);
        await queryRunner.query(`ALTER TABLE "security_history" DROP CONSTRAINT "REL_022e8d2fc65553fb7470c3cf3c"`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative_history" DROP CONSTRAINT "FK_1fce116ee6729a872de763e0225"`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative_history" DROP CONSTRAINT "REL_1fce116ee6729a872de763e022"`);
        await queryRunner.query(`ALTER TABLE "jurisdiction_history" DROP CONSTRAINT "REL_10313eb74a5f7c95770b0c27d0"`);
        await queryRunner.query(`ALTER TABLE "fire_safety_history" DROP CONSTRAINT "REL_26366890b5ae02523c8bb61e51"`);
        await queryRunner.query(`ALTER TABLE "facility_history" DROP CONSTRAINT "FK_b7133352bed6d2c7225e8814a0b"`);
        await queryRunner.query(`ALTER TABLE "facility_history" DROP CONSTRAINT "REL_b7133352bed6d2c7225e8814a0"`);
        await queryRunner.query(`ALTER TABLE "contact_history" DROP CONSTRAINT "REL_0c3dc8902a378fab9b3fe15d81"`);
        await queryRunner.query(`ALTER TABLE "weighing_history" ADD CONSTRAINT "FK_70b1f283730c20f6dde9fde6b21" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_history" ADD CONSTRAINT "FK_022e8d2fc65553fb7470c3cf3cd" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative_history" ADD CONSTRAINT "FK_1fce116ee6729a872de763e0225" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jurisdiction_history" ADD CONSTRAINT "FK_10313eb74a5f7c95770b0c27d03" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fire_safety_history" ADD CONSTRAINT "FK_26366890b5ae02523c8bb61e510" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "facility_history" ADD CONSTRAINT "FK_b7133352bed6d2c7225e8814a0b" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact_history" ADD CONSTRAINT "FK_0c3dc8902a378fab9b3fe15d818" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_history" DROP CONSTRAINT "FK_0c3dc8902a378fab9b3fe15d818"`);
        await queryRunner.query(`ALTER TABLE "facility_history" DROP CONSTRAINT "FK_b7133352bed6d2c7225e8814a0b"`);
        await queryRunner.query(`ALTER TABLE "fire_safety_history" DROP CONSTRAINT "FK_26366890b5ae02523c8bb61e510"`);
        await queryRunner.query(`ALTER TABLE "jurisdiction_history" DROP CONSTRAINT "FK_10313eb74a5f7c95770b0c27d03"`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative_history" DROP CONSTRAINT "FK_1fce116ee6729a872de763e0225"`);
        await queryRunner.query(`ALTER TABLE "security_history" DROP CONSTRAINT "FK_022e8d2fc65553fb7470c3cf3cd"`);
        await queryRunner.query(`ALTER TABLE "weighing_history" DROP CONSTRAINT "FK_70b1f283730c20f6dde9fde6b21"`);
        await queryRunner.query(`ALTER TABLE "contact_history" ADD CONSTRAINT "REL_0c3dc8902a378fab9b3fe15d81" UNIQUE ("warehouseLocationId")`);
        await queryRunner.query(`ALTER TABLE "facility_history" ADD CONSTRAINT "REL_b7133352bed6d2c7225e8814a0" UNIQUE ("warehouseLocationId")`);
        await queryRunner.query(`ALTER TABLE "facility_history" ADD CONSTRAINT "FK_b7133352bed6d2c7225e8814a0b" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fire_safety_history" ADD CONSTRAINT "REL_26366890b5ae02523c8bb61e51" UNIQUE ("warehouseLocationId")`);
        await queryRunner.query(`ALTER TABLE "jurisdiction_history" ADD CONSTRAINT "REL_10313eb74a5f7c95770b0c27d0" UNIQUE ("warehouseLocationId")`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative_history" ADD CONSTRAINT "REL_1fce116ee6729a872de763e022" UNIQUE ("warehouseLocationId")`);
        await queryRunner.query(`ALTER TABLE "technical_qualitative_history" ADD CONSTRAINT "FK_1fce116ee6729a872de763e0225" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_history" ADD CONSTRAINT "REL_022e8d2fc65553fb7470c3cf3c" UNIQUE ("warehouseLocationId")`);
        await queryRunner.query(`ALTER TABLE "weighing_history" ADD CONSTRAINT "REL_70b1f283730c20f6dde9fde6b2" UNIQUE ("warehouseLocationId")`);
        await queryRunner.query(`ALTER TABLE "contact_history" ADD CONSTRAINT "FK_0c3dc8902a378fab9b3fe15d818" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fire_safety_history" ADD CONSTRAINT "FK_26366890b5ae02523c8bb61e510" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jurisdiction_history" ADD CONSTRAINT "FK_10313eb74a5f7c95770b0c27d03" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_history" ADD CONSTRAINT "FK_022e8d2fc65553fb7470c3cf3cd" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "weighing_history" ADD CONSTRAINT "FK_70b1f283730c20f6dde9fde6b21" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
