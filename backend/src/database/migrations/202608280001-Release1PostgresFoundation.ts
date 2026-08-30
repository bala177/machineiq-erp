import { MigrationInterface, QueryRunner } from 'typeorm';

export class Release1PostgresFoundation2026082800001 implements MigrationInterface {
  name = 'Release1PostgresFoundation2026082800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('admin','manager','sales','designer','leadership')`);
    await queryRunner.query(`CREATE TYPE "role_permissions_role_enum" AS ENUM ('admin','manager','sales','designer','leadership')`);
    await queryRunner.query(`CREATE TYPE "locations_type_enum" AS ENUM ('office','warehouse','factory','service')`);
    await queryRunner.query(`CREATE TYPE "items_item_type_enum" AS ENUM ('raw','component','assembly','service')`);
    await queryRunner.query(`CREATE TYPE "document_types_reset_frequency_enum" AS ENUM ('never','yearly','monthly')`);

    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL UNIQUE, "code" varchar(40), "description" text,
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_name" varchar(120) NOT NULL, "last_name" varchar(120) NOT NULL,
        "email" varchar(320) NOT NULL UNIQUE, "password_hash" text NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'designer', "department_id" uuid,
        "title" varchar(160), "phone" varchar(40), "is_active" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_users_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(160) NOT NULL UNIQUE, "module" varchar(120) NOT NULL,
        "action" varchar(120) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), UNIQUE ("module", "action")
      )`);
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "role" "role_permissions_role_enum" NOT NULL,
        "permission_id" uuid NOT NULL, "allowed" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), UNIQUE ("role", "permission_id"),
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL, "code" varchar(40) NOT NULL UNIQUE, "email" varchar(320),
        "phone" varchar(40), "website" varchar(500), "tax_registration_number" varchar(80),
        "registration_number" varchar(80), "base_currency" varchar(8) NOT NULL DEFAULT 'INR',
        "timezone" varchar(80) NOT NULL DEFAULT 'Asia/Kolkata', "address" text, "city" varchar(120),
        "state_province" varchar(120), "postal_code" varchar(24), "country" varchar(120) NOT NULL DEFAULT 'India',
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "company_id" uuid NOT NULL,
        "tax_registration_number" varchar(80), "email" varchar(320), "phone" varchar(40), "address" text,
        "city" varchar(120), "state_province" varchar(120), "postal_code" varchar(24),
        "country" varchar(120) NOT NULL DEFAULT 'India', "is_active" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_branches_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_branches_company_name" ON "branches" ("company_id", "name")`);

    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "branch_id" uuid NOT NULL,
        "type" "locations_type_enum" NOT NULL DEFAULT 'office', "address" text, "city" varchar(120),
        "state_province" varchar(120), "postal_code" varchar(24), "country" varchar(120) NOT NULL DEFAULT 'India',
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_locations_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_locations_branch_type" ON "locations" ("branch_id", "type")`);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL UNIQUE, "name" varchar(200) NOT NULL,
        "account_type" varchar(20) NOT NULL DEFAULT 'prospect', "customer_type" varchar(20) NOT NULL DEFAULT 'business',
        "display_name" varchar(200), "company_size" varchar(20), "industry" varchar(160), "website" varchar(500),
        "contact_person" varchar(200), "email" varchar(320), "phone" varchar(40), "mobile" varchar(40),
        "designation" varchar(160), "department" varchar(160), "secondary_contact_name" varchar(200),
        "secondary_contact_email" varchar(320), "secondary_contact_phone" varchar(40), "address" text,
        "city" varchar(120), "state_province" varchar(120), "postal_code" varchar(24), "country" varchar(120),
        "shipping_address" text, "shipping_city" varchar(120), "shipping_state_province" varchar(120),
        "shipping_postal_code" varchar(24), "shipping_country" varchar(120), "vat_number" varchar(80),
        "tax_treatment" varchar(120), "place_of_supply" varchar(120), "registration_number" varchar(80),
        "payment_terms" varchar(120), "currency_code" varchar(8) NOT NULL DEFAULT 'INR',
        "credit_limit" numeric(18,4) NOT NULL DEFAULT 0 CHECK ("credit_limit" >= 0),
        "price_list" varchar(120), "delivery_terms" varchar(200), "notes" text, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_name" ON "customers" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_account_type" ON "customers" ("account_type")`);

    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "contact_person" varchar(200),
        "email" varchar(320), "phone" varchar(40), "address" text, "category" varchar(160),
        "payment_terms" varchar(120), "tax_registration_number" varchar(80),
        "currency_code" varchar(8) NOT NULL DEFAULT 'INR', "bank_details" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "qualification_status" varchar(20) NOT NULL DEFAULT 'pending',
        "default_lead_time_days" integer NOT NULL DEFAULT 0 CHECK ("default_lead_time_days" >= 0),
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_suppliers_name" ON "suppliers" ("name")`);

    await queryRunner.query(`
      CREATE TABLE "item_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "parent_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_item_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "item_categories"("id") ON DELETE RESTRICT
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_item_categories_name" ON "item_categories" ("name")`);

    await queryRunner.query(`
      CREATE TABLE "uoms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "base_uom_id" uuid,
        "conversion_factor" numeric(18,6) NOT NULL DEFAULT 1,
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_uoms_conversion_factor" CHECK ("conversion_factor" > 0),
        CONSTRAINT "FK_uoms_base" FOREIGN KEY ("base_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT
      )`);

    await queryRunner.query(`
      CREATE TABLE "items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "description" text,
        "category_id" uuid NOT NULL, "uom_id" uuid NOT NULL, "item_type" "items_item_type_enum" NOT NULL,
        "standard_cost" numeric(18,4) NOT NULL DEFAULT 0 CHECK ("standard_cost" >= 0),
        "selling_price" numeric(18,4) NOT NULL DEFAULT 0 CHECK ("selling_price" >= 0),
        "hsn_sac" varchar(40), "tax_percent" numeric(7,4) NOT NULL DEFAULT 0 CHECK ("tax_percent" BETWEEN 0 AND 100),
        "is_stock_item" boolean NOT NULL DEFAULT true, "reorder_level" numeric(18,4) NOT NULL DEFAULT 0 CHECK ("reorder_level" >= 0),
        "default_supplier_id" uuid, "lead_time_days" integer NOT NULL DEFAULT 0 CHECK ("lead_time_days" >= 0),
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_items_category" FOREIGN KEY ("category_id") REFERENCES "item_categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_items_uom" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_items_supplier" FOREIGN KEY ("default_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_items_name" ON "items" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_items_category_active" ON "items" ("category_id", "is_active")`);

    await queryRunner.query(`
      CREATE TABLE "document_types" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(120) NOT NULL UNIQUE, "name" varchar(200) NOT NULL, "prefix" varchar(40) NOT NULL,
        "padding" integer NOT NULL DEFAULT 4 CHECK ("padding" BETWEEN 1 AND 10),
        "reset_frequency" "document_types_reset_frequency_enum" NOT NULL DEFAULT 'yearly',
        "next_number" bigint NOT NULL DEFAULT 1 CHECK ("next_number" >= 1), "last_period" varchar(20) NOT NULL DEFAULT '',
        "is_active" boolean NOT NULL DEFAULT true, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`CREATE TABLE "sequences" ("key" varchar(160) PRIMARY KEY, "value" bigint NOT NULL DEFAULT 0 CHECK ("value" >= 0))`);
    await queryRunner.query(`
      CREATE TABLE "system_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar(160) NOT NULL UNIQUE, "value" jsonb NOT NULL, "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "action" varchar(80) NOT NULL,
        "entity_type" varchar(120) NOT NULL, "entity_id" uuid NOT NULL, "performed_by" uuid NOT NULL,
        "project_id" uuid, "previous_values" jsonb, "new_values" jsonb, "ip_address" inet,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user" ON "audit_logs" ("performed_by")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_project" ON "audit_logs" ("project_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created" ON "audit_logs" ("created_at" DESC)`);

    await queryRunner.query(`
      CREATE TABLE "runtime_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "domain" varchar(80) NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_runtime_documents_domain_id" UNIQUE ("domain", "id")
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_runtime_documents_domain_deleted" ON "runtime_documents" ("domain", "deleted_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_runtime_documents_data_gin" ON "runtime_documents" USING GIN ("data")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'runtime_documents', 'audit_logs', 'system_settings', 'sequences', 'document_types', 'items', 'uoms', 'item_categories',
      'suppliers', 'customers', 'locations', 'branches', 'companies', 'role_permissions',
      'permissions', 'users', 'departments',
    ]) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    await queryRunner.query(`DROP TYPE IF EXISTS "document_types_reset_frequency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "items_item_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "locations_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "role_permissions_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
