import { MigrationInterface, QueryRunner } from 'typeorm';

export class DepartmentManagementPermission2026090100002 implements MigrationInterface {
  name = 'DepartmentManagementPermission2026090100002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "module", "action", "description", "is_active")
      VALUES ('departments.manage', 'Departments', 'Manage', 'Manage Departments', true)
      ON CONFLICT ("code") DO UPDATE SET
        "module" = EXCLUDED."module",
        "action" = EXCLUDED."action",
        "description" = EXCLUDED."description",
        "is_active" = true,
        "deleted_at" = NULL,
        "updated_at" = now()
    `);
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role", "permission_id", "allowed")
      SELECT 'admin', "id", true FROM "permissions" WHERE "code" = 'departments.manage'
      ON CONFLICT ("role", "permission_id") DO UPDATE SET
        "allowed" = true,
        "deleted_at" = NULL,
        "updated_at" = now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "role" = 'admin'
        AND "permission_id" = (SELECT "id" FROM "permissions" WHERE "code" = 'departments.manage')
    `);
    await queryRunner.query(`DELETE FROM "permissions" WHERE "code" = 'departments.manage'`);
  }
}
