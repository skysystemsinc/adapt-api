import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLabelToFormSubmissionValues1763000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'form_submission_values',
      new TableColumn({
        name: 'label',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('form_submission_values', 'label');
  }
}

