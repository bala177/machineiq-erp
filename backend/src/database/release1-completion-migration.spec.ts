import { Release1Completion2026091000001 } from './migrations/202609100001-Release1Completion';

describe('Release 1 completion migration', () => {
  it('creates every missing controlled master and grants only the management permission', async () => {
    const queries: string[] = [];
    const runner = { query: jest.fn(async (sql: string) => { queries.push(sql); return []; }) };
    await new Release1Completion2026091000001().up(runner as any);
    const sql = queries.join('\n');
    for (const table of ['warehouses', 'employees', 'currencies', 'tax_rates', 'reference_statuses']) expect(sql).toContain(`CREATE TABLE "${table}"`);
    expect(sql).toContain("'foundation.manage'");
    expect(sql).toContain("r.key='admin'");
  });

  it('uses history-preserving foreign-key behavior for employee and warehouse ownership', async () => {
    const queries: string[] = [];
    await new Release1Completion2026091000001().up({ query: async (sql: string) => { queries.push(sql); } } as any);
    const sql = queries.join('\n');
    expect(sql).toContain('REFERENCES "locations"("id") ON DELETE RESTRICT');
    expect(sql).toContain('REFERENCES "users"("id") ON DELETE SET NULL');
    expect(sql).toContain('CHK_employee_not_own_manager');
  });
});
