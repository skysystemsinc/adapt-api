import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOtpFieldsToUsers1760000000004 implements MigrationInterface {
  name = 'AddOtpFieldsToUsers1760000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'otp',
        type: 'varchar',
        length: '4',
        isNullable: true,
        comment: 'One-time password for email verification',
      }),
      new TableColumn({
        name: 'otpExpires',
        type: 'timestamp',
        isNullable: true,
        comment: 'OTP expiration timestamp',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', ['otp', 'otpExpires']);
  }
}
