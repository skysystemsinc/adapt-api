import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRBACTables1766000000000 implements MigrationInterface {
  name = 'CreateRBACTables1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // Create role_permissions pivot table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("roleId") 
          REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permissionId") 
          REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UQ_role_permissions" UNIQUE ("roleId", "permissionId")
      )
    `);

    // Create user_roles pivot table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("userId") 
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("roleId") 
          REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UQ_user_roles" UNIQUE ("userId", "roleId")
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_role_permissions_roleId" ON "role_permissions" ("roleId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_role_permissions_permissionId" ON "role_permissions" ("permissionId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_userId" ON "user_roles" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_roleId" ON "user_roles" ("roleId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_roles_roleId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_roles_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_permissions_permissionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_permissions_roleId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}

