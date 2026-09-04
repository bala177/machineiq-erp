import { MigrationInterface, QueryRunner } from 'typeorm';

export class ZohoParityMasterData2026090400001 implements MigrationInterface {
  name = 'ZohoParityMasterData2026090400001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD COLUMN "industry" varchar(160),
        ADD COLUMN "fiscal_year_start_month" varchar(20) NOT NULL DEFAULT 'april',
        ADD COLUMN "date_format" varchar(40) NOT NULL DEFAULT 'dd/MM/yyyy',
        ADD COLUMN "language_code" varchar(12) NOT NULL DEFAULT 'en'
    `);
    await queryRunner.query(`
      ALTER TABLE "suppliers"
        ADD COLUMN "display_name" varchar(200),
        ADD COLUMN "website" varchar(500),
        ADD COLUMN "mobile" varchar(40),
        ADD COLUMN "designation" varchar(160),
        ADD COLUMN "department" varchar(160),
        ADD COLUMN "city" varchar(120),
        ADD COLUMN "state_province" varchar(120),
        ADD COLUMN "postal_code" varchar(24),
        ADD COLUMN "country" varchar(120),
        ADD COLUMN "tax_treatment" varchar(120),
        ADD COLUMN "place_of_supply" varchar(120),
        ADD COLUMN "notes" text
    `);
    await queryRunner.query(`
      ALTER TABLE "items"
        ADD COLUMN "manufacturer_part_number" varchar(120),
        ADD COLUMN "barcode" varchar(120),
        ADD COLUMN "sales_description" text,
        ADD COLUMN "purchase_description" text,
        ADD COLUMN "sales_enabled" boolean NOT NULL DEFAULT true,
        ADD COLUMN "purchase_enabled" boolean NOT NULL DEFAULT true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "purchase_enabled", DROP COLUMN "sales_enabled", DROP COLUMN "purchase_description", DROP COLUMN "sales_description", DROP COLUMN "barcode", DROP COLUMN "manufacturer_part_number"`);
    await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "notes", DROP COLUMN "place_of_supply", DROP COLUMN "tax_treatment", DROP COLUMN "country", DROP COLUMN "postal_code", DROP COLUMN "state_province", DROP COLUMN "city", DROP COLUMN "department", DROP COLUMN "designation", DROP COLUMN "mobile", DROP COLUMN "website", DROP COLUMN "display_name"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "language_code", DROP COLUMN "date_format", DROP COLUMN "fiscal_year_start_month", DROP COLUMN "industry"`);
  }
}
