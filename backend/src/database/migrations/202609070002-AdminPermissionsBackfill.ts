import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminPermissionsBackfill2026090700002 implements MigrationInterface {
  name = 'AdminPermissionsBackfill2026090700002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "module", "action", "description", "is_active")
      VALUES
        ('items.manage', 'Items', 'Manage', 'Manage Items', true),
        ('customers.manage', 'Customers', 'Manage', 'Manage Customers', true),
        ('suppliers.manage', 'Suppliers', 'Manage', 'Manage Suppliers', true),
        ('organization.manage', 'Organization', 'Manage', 'Manage Organization', true),
        ('departments.manage', 'Departments', 'Manage', 'Manage Departments', true),
        ('audit-logs.view', 'Audit Logs', 'View', 'View Audit Logs', true),
        ('permissions.manage', 'Access Control', 'Manage', 'Manage Access Control', true),
        ('document-types.manage', 'Document Types', 'Manage', 'Manage Document Types', true),
        ('components.link-item', 'Components', 'Link Item', 'Link Item Components', true)
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
      SELECT 'admin', "id", true
      FROM "permissions"
      WHERE "code" IN (
        'items.manage',
        'customers.manage',
        'suppliers.manage',
        'organization.manage',
        'departments.manage',
        'audit-logs.view',
        'permissions.manage',
        'document-types.manage',
        'components.link-item'
      )
      ON CONFLICT ("role", "permission_id") DO UPDATE SET
        "allowed" = true,
        "deleted_at" = NULL,
        "updated_at" = now()
    `);
  }

  public async down(): Promise<void> {
    // This is a repair migration for existing installations. Reverting it must
    // not remove permissions or assignments that may predate the migration.
  }
}
