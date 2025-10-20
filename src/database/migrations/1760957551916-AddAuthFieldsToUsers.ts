import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAuthFieldsToUsers1760957551916 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('users', [
            new TableColumn({
                name: 'refreshToken',
                type: 'varchar',
                isNullable: true,
                comment: 'Refresh token for JWT authentication',
            }),
            new TableColumn({
                name: 'passwordResetToken',
                type: 'varchar',
                isNullable: true,
                comment: 'Token for password reset',
            }),
            new TableColumn({
                name: 'passwordResetExpires',
                type: 'timestamp',
                isNullable: true,
                comment: 'Password reset token expiration timestamp',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('users', ['refreshToken', 'passwordResetToken', 'passwordResetExpires']);
    }

}
