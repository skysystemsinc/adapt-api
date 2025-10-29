import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeApplicationTypeIdNullable1765000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make applicationTypeId column nullable in registration_application table
    await queryRunner.changeColumn(
      'registration_application',
      'applicationTypeId',
      new TableColumn({
        name: 'applicationTypeId',
        type: 'uuid',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert applicationTypeId back to NOT NULL
    await queryRunner.changeColumn(
      'registration_application',
      'applicationTypeId',
      new TableColumn({
        name: 'applicationTypeId',
        type: 'uuid',
        isNullable: false,
      }),
    );
  }
}

