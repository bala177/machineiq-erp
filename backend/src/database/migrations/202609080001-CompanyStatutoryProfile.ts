import { MigrationInterface, QueryRunner } from 'typeorm';

const DOCUMENT_KINDS = [
  'logo', 'cin_certificate', 'gst_certificate', 'pan_certificate', 'tan_certificate',
  'msme_certificate', 'moa', 'aoa', 'director_photo', 'din_certificate',
  'director_aadhaar', 'director_pan', 'shareholding_certificate',
];

export class CompanyStatutoryProfile2026090800001 implements MigrationInterface {
  name = 'CompanyStatutoryProfile2026090800001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD COLUMN IF NOT EXISTS "cin" varchar(21),
        ADD COLUMN IF NOT EXISTS "gstin" varchar(15),
        ADD COLUMN IF NOT EXISTS "pan" varchar(10),
        ADD COLUMN IF NOT EXISTS "tan" varchar(10),
        ADD COLUMN IF NOT EXISTS "msme_number" varchar(40),
        ADD COLUMN IF NOT EXISTS "incorporated_on" date
    `);

    // The two pre-existing generic fields already carry Indian identifiers on
    // seeded and live installations. Promote them where the value is genuinely
    // a GSTIN / CIN, and leave anything else untouched.
    await queryRunner.query(`
      UPDATE "companies"
         SET "gstin" = upper("tax_registration_number")
       WHERE "gstin" IS NULL
         AND upper("tax_registration_number") ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$'
    `);
    await queryRunner.query(`
      UPDATE "companies"
         SET "cin" = upper("registration_number")
       WHERE "cin" IS NULL
         AND upper("registration_number") ~ '^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$'
    `);

    await queryRunner.query(`
      CREATE TABLE "company_directors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "designation" varchar(160),
        "din" varchar(8),
        "email" varchar(320),
        "phone" varchar(40),
        "shareholding_percent" numeric(5,2),
        "appointed_on" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "PK_company_directors" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_company_directors_din" CHECK ("din" IS NULL OR "din" ~ '^[0-9]{8}$'),
        CONSTRAINT "CHK_company_directors_shareholding" CHECK ("shareholding_percent" IS NULL OR ("shareholding_percent" >= 0 AND "shareholding_percent" <= 100)),
        CONSTRAINT "FK_company_directors_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_company_directors_company" ON "company_directors" ("company_id")`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_company_directors_din" ON "company_directors" ("din")
      WHERE "din" IS NOT NULL AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "company_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "director_id" uuid,
        "kind" varchar(40) NOT NULL,
        "file_name" varchar(260) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "size_bytes" integer NOT NULL,
        "content" text NOT NULL,
        "issued_on" date,
        "uploaded_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "PK_company_documents" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_company_documents_kind" CHECK ("kind" IN (${DOCUMENT_KINDS.map((kind) => `'${kind}'`).join(',')})),
        CONSTRAINT "CHK_company_documents_size" CHECK ("size_bytes" > 0),
        CONSTRAINT "FK_company_documents_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_company_documents_director" FOREIGN KEY ("director_id") REFERENCES "company_directors"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_company_documents_uploader" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_company_documents_company_kind" ON "company_documents" ("company_id", "kind")`);
    // One live attachment per slot: per company for the statutory certificates,
    // per director for the personal soft copies.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_company_documents_company_slot" ON "company_documents" ("company_id", "kind")
      WHERE "director_id" IS NULL AND "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_company_documents_director_slot" ON "company_documents" ("director_id", "kind")
      WHERE "director_id" IS NOT NULL AND "deleted_at" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "company_documents"`);
    await queryRunner.query(`DROP TABLE "company_directors"`);
    await queryRunner.query(`
      ALTER TABLE "companies"
        DROP COLUMN "cin",
        DROP COLUMN "gstin",
        DROP COLUMN "pan",
        DROP COLUMN "tan",
        DROP COLUMN "msme_number",
        DROP COLUMN "incorporated_on"
    `);
  }
}
