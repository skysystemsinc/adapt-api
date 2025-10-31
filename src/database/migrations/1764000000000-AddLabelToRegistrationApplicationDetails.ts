import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLabelToRegistrationApplicationDetails1764000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'registration_application_details',
      new TableColumn({
        name: 'label',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('registration_application_details', 'label');
  }
}

