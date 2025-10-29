import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFieldWidth1762000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'form_fields',
      new TableColumn({
        name: 'width',
        type: 'varchar',
        default: "'full'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('form_fields', 'width');
  }
}

