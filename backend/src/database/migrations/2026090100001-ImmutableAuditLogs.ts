import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImmutableAuditLogs2026090100001 implements MigrationInterface {
  name = 'ImmutableAuditLogs2026090100001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'audit_logs are immutable';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TRG_audit_logs_immutable"
      BEFORE UPDATE OR DELETE ON "audit_logs"
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "TRG_audit_logs_immutable" ON "audit_logs"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_audit_log_mutation()`);
  }
}
