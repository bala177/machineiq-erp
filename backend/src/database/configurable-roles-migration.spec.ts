import { ConfigurableRoles2026090900001 } from './migrations/202609090001-ConfigurableRoles';

describe('ConfigurableRoles migration', () => {
  function runner() {
    const queries: string[] = [];
    return { queries, query: jest.fn(async (sql: string) => { queries.push(sql); return []; }) };
  }

  it('seeds the five system roles under their current enum values', async () => {
    const q = runner();
    await new ConfigurableRoles2026090900001().up(q as any);
    const seed = q.queries.find((sql) => sql.includes('INSERT INTO "roles"'));
    expect(seed).toBeDefined();
    for (const key of ['admin', 'manager', 'sales', 'designer', 'leadership']) expect(seed).toContain(`'${key}'`);
  });

  it('marks every seeded role as a system role so none can be edited away', async () => {
    const q = runner();
    await new ConfigurableRoles2026090900001().up(q as any);
    const seed = q.queries.find((sql) => sql.includes('INSERT INTO "roles"'))!;
    expect(seed.match(/true/g)).toHaveLength(5);
  });

  it('backfills the foreign keys before dropping what they were derived from', async () => {
    const q = runner();
    await new ConfigurableRoles2026090900001().up(q as any);
    const at = (match: (sql: string) => boolean) => q.queries.findIndex(match);
    const backfillUsers = at((sql) => sql.includes('UPDATE "users"') && sql.includes('role_id'));
    const relaxUserEnum = at((sql) => sql.includes('ALTER TABLE "users"') && sql.includes('TYPE varchar'));
    const backfillGrants = at((sql) => sql.includes('UPDATE "role_permissions"') && sql.includes('role_id'));
    const dropGrantRole = at((sql) => sql.includes('ALTER TABLE "role_permissions"') && sql.includes('DROP COLUMN "role"'));

    expect(backfillUsers).toBeGreaterThan(-1);
    expect(relaxUserEnum).toBeGreaterThan(backfillUsers);
    expect(backfillGrants).toBeGreaterThan(-1);
    expect(dropGrantRole).toBeGreaterThan(backfillGrants);
  });

  it('constrains a role to one row per permission after the key changes', async () => {
    const q = runner();
    await new ConfigurableRoles2026090900001().up(q as any);
    expect(q.queries.join('\n')).toContain('UNIQUE ("role_id", "permission_id")');
  });

  it('reassigns users on custom roles to designer on the way down, because the enum cannot hold them', async () => {
    const q = runner();
    await new ConfigurableRoles2026090900001().down(q as any);
    const reassign = q.queries.find((sql) => sql.includes("'designer'"));
    expect(reassign).toContain('is_system');
  });
});
