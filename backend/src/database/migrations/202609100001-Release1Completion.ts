import { MigrationInterface, QueryRunner } from 'typeorm';

export class Release1Completion2026091000001 implements MigrationInterface {
  name = 'Release1Completion2026091000001';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "warehouses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "code" varchar(40) NOT NULL UNIQUE,
        "name" varchar(200) NOT NULL, "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE RESTRICT,
        "manager_id" uuid REFERENCES "users"("id") ON DELETE SET NULL, "description" text,
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_warehouses_location" ON "warehouses"("location_id");
      CREATE TABLE "employees" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "employee_code" varchar(40) NOT NULL UNIQUE,
        "user_id" uuid UNIQUE REFERENCES "users"("id") ON DELETE SET NULL,
        "first_name" varchar(120) NOT NULL, "last_name" varchar(120) NOT NULL,
        "email" varchar(320) UNIQUE, "phone" varchar(40), "designation" varchar(160),
        "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL,
        "manager_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL, "hire_date" date,
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_employee_not_own_manager" CHECK ("manager_id" IS NULL OR "manager_id" <> "id")
      );
      CREATE INDEX "IDX_employees_department" ON "employees"("department_id");
      CREATE TABLE "currencies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "code" varchar(3) NOT NULL UNIQUE,
        "name" varchar(120) NOT NULL, "symbol" varchar(12), "precision" smallint NOT NULL DEFAULT 2 CHECK ("precision" BETWEEN 0 AND 4),
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      INSERT INTO "currencies"("code","name","symbol","precision") VALUES
        ('INR','Indian Rupee','₹',2),('USD','US Dollar','$',2),('EUR','Euro','€',2),('GBP','Pound Sterling','£',2),('JPY','Japanese Yen','¥',0);
      CREATE TABLE "tax_rates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "code" varchar(40) NOT NULL, "name" varchar(120) NOT NULL, "rate" numeric(7,4) NOT NULL CHECK ("rate" BETWEEN 0 AND 100),
        "effective_from" date, "effective_to" date, "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE("company_id","code"), CONSTRAINT "CHK_tax_date_range" CHECK ("effective_to" IS NULL OR "effective_from" IS NULL OR "effective_to" >= "effective_from")
      );
      INSERT INTO "tax_rates"("company_id","code","name","rate") SELECT id,'GST'||rate::text,'GST '||rate::text||'%',rate FROM companies CROSS JOIN (VALUES (0),(5),(12),(18),(28)) rates(rate) WHERE deleted_at IS NULL;
      CREATE TABLE "reference_statuses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "module" varchar(80) NOT NULL, "code" varchar(40) NOT NULL,
        "label" varchar(120) NOT NULL, "sort_order" integer NOT NULL DEFAULT 0, "is_terminal" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), UNIQUE("module","code")
      );
      INSERT INTO "reference_statuses"("module","code","label","sort_order","is_terminal") VALUES
        ('common','draft','Draft',10,false),('common','active','Active',20,false),('common','inactive','Inactive',30,true),('common','blocked','Blocked',40,true);
    `);
    await q.query(`INSERT INTO permissions(code,module,action,description,is_active) VALUES('foundation.manage','foundation','manage','Manage R1 employee, warehouse, currency, tax and status masters',true) ON CONFLICT(code) DO UPDATE SET is_active=true`);
    await q.query(`INSERT INTO role_permissions(role_id,permission_id,allowed) SELECT r.id,p.id,true FROM roles r CROSS JOIN permissions p WHERE r.key='admin' AND p.code='foundation.manage' ON CONFLICT(role_id,permission_id) DO UPDATE SET allowed=true`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE code='foundation.manage')`);
    await q.query(`DELETE FROM permissions WHERE code='foundation.manage'`);
    await q.query(`DROP TABLE IF EXISTS "reference_statuses", "tax_rates", "currencies", "employees", "warehouses"`);
  }
}
