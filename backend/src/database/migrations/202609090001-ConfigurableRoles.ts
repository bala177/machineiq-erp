import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Turns the fixed Role enum into a `roles` table, so an administrator can define a role
 * without a code change.
 *
 * The five existing roles are seeded as system roles keyed by their current enum values, so
 * every stored string and every comparison against one keeps resolving. `users.role` is kept
 * as a varchar mirror of `roles.key` because raw SQL in the sales module and role comparisons
 * in the frontend still read it; `users.role_id` is the source of truth.
 *
 * The down migration is lossy and cannot be otherwise: a custom role has no enum value to
 * return to, so users holding one are reassigned to `designer`.
 */
export class ConfigurableRoles2026090900001 implements MigrationInterface {
  name = 'ConfigurableRoles2026090900001';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar(60) NOT NULL UNIQUE,
        "name" varchar(120) NOT NULL,
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);

    await q.query(`
      INSERT INTO "roles" ("key", "name", "description", "is_system") VALUES
        ('admin', 'Admin', 'Full system access: users, roles, departments, settings, and all workflow data.', true),
        ('manager', 'Manager', 'Responsible for overall projects: conversion, kickoff, milestones, assignments, and delivery health.', true),
        ('sales', 'Sales', 'Create machine inquiries, maintain intake details, and follow customer request status.', true),
        ('designer', 'Designer', 'Work on assigned engineering tasks, machines, components, reviews, blockers, and design release.', true),
        ('leadership', 'Leadership', 'Read clear dashboards, reports, escalations, and project health without operational edit controls.', true)
    `);

    // Users: point at the table, then relax the enum column into the mirror it becomes.
    await q.query(`ALTER TABLE "users" ADD COLUMN "role_id" uuid`);
    await q.query(`UPDATE "users" SET "role_id" = (SELECT "id" FROM "roles" WHERE "roles"."key" = "users"."role"::text)`);
    await q.query(`ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL`);
    await q.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id")`);
    await q.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE varchar(60) USING "role"::text`);
    await q.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'designer'`);
    await q.query(`DROP TYPE IF EXISTS "users_role_enum"`);

    // Grants: same move, but a grant for a role that somehow has no row is meaningless.
    await q.query(`ALTER TABLE "role_permissions" ADD COLUMN "role_id" uuid`);
    await q.query(`UPDATE "role_permissions" SET "role_id" = (SELECT "id" FROM "roles" WHERE "roles"."key" = "role_permissions"."role"::text)`);
    await q.query(`DELETE FROM "role_permissions" WHERE "role_id" IS NULL`);
    await q.query(`ALTER TABLE "role_permissions" ALTER COLUMN "role_id" SET NOT NULL`);
    await q.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE`);
    await q.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "UQ_role_permissions_role_permission"`);
    await q.query(`ALTER TABLE "role_permissions" DROP COLUMN "role"`);
    await q.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "UQ_role_permissions_role_permission" UNIQUE ("role_id", "permission_id")`);
    await q.query(`DROP TYPE IF EXISTS "role_permissions_role_enum"`);

    await q.query(`CREATE INDEX "IDX_users_role_id" ON "users" ("role_id")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    // Lossy by necessity: the enum has no value for a custom role.
    await q.query(`UPDATE "users" SET "role" = 'designer' WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "is_system" = false)`);
    await q.query(`DELETE FROM "role_permissions" WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "is_system" = false)`);

    await q.query(`DROP INDEX IF EXISTS "IDX_users_role_id"`);
    await q.query(`CREATE TYPE "role_permissions_role_enum" AS ENUM ('admin','manager','sales','designer','leadership')`);
    await q.query(`ALTER TABLE "role_permissions" ADD COLUMN "role" "role_permissions_role_enum"`);
    await q.query(`UPDATE "role_permissions" SET "role" = (SELECT "key" FROM "roles" WHERE "roles"."id" = "role_permissions"."role_id")::"role_permissions_role_enum"`);
    await q.query(`ALTER TABLE "role_permissions" ALTER COLUMN "role" SET NOT NULL`);
    await q.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "UQ_role_permissions_role_permission"`);
    await q.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role"`);
    await q.query(`ALTER TABLE "role_permissions" DROP COLUMN "role_id"`);
    await q.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "UQ_role_permissions_role_permission" UNIQUE ("role", "permission_id")`);

    await q.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_role"`);
    await q.query(`ALTER TABLE "users" DROP COLUMN "role_id"`);
    await q.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await q.query(`CREATE TYPE "users_role_enum" AS ENUM ('admin','manager','sales','designer','leadership')`);
    await q.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "users_role_enum" USING "role"::"users_role_enum"`);
    await q.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'designer'`);

    await q.query(`DROP TABLE "roles"`);
  }
}
