import dataSource from '../database/data-source';

type Check = { name: string; sql: string; expected: number };

const checks: Check[] = [
  { name: 'branch/company orphans', sql: 'SELECT COUNT(*)::int AS count FROM branches b LEFT JOIN companies c ON c.id = b.company_id WHERE c.id IS NULL', expected: 0 },
  { name: 'location/branch orphans', sql: 'SELECT COUNT(*)::int AS count FROM locations l LEFT JOIN branches b ON b.id = l.branch_id WHERE b.id IS NULL', expected: 0 },
  { name: 'user/department orphans', sql: 'SELECT COUNT(*)::int AS count FROM users u LEFT JOIN departments d ON d.id = u.department_id WHERE u.department_id IS NOT NULL AND d.id IS NULL', expected: 0 },
  { name: 'item/category orphans', sql: 'SELECT COUNT(*)::int AS count FROM items i LEFT JOIN item_categories c ON c.id = i.category_id WHERE c.id IS NULL', expected: 0 },
  { name: 'item/UOM orphans', sql: 'SELECT COUNT(*)::int AS count FROM items i LEFT JOIN uoms u ON u.id = i.uom_id WHERE u.id IS NULL', expected: 0 },
  { name: 'item/supplier orphans', sql: 'SELECT COUNT(*)::int AS count FROM items i LEFT JOIN suppliers s ON s.id = i.default_supplier_id WHERE i.default_supplier_id IS NOT NULL AND s.id IS NULL', expected: 0 },
  { name: 'role/permission orphans', sql: 'SELECT COUNT(*)::int AS count FROM role_permissions rp LEFT JOIN permissions p ON p.id = rp.permission_id WHERE p.id IS NULL', expected: 0 },
  { name: 'invalid item amounts', sql: 'SELECT COUNT(*)::int AS count FROM items WHERE standard_cost < 0 OR selling_price < 0 OR tax_percent < 0 OR tax_percent > 100 OR reorder_level < 0', expected: 0 },
  { name: 'duplicate master codes', sql: `SELECT COUNT(*)::int AS count FROM (SELECT code FROM customers GROUP BY code HAVING COUNT(*) > 1 UNION ALL SELECT code FROM suppliers GROUP BY code HAVING COUNT(*) > 1 UNION ALL SELECT code FROM items GROUP BY code HAVING COUNT(*) > 1) duplicates`, expected: 0 },
  { name: 'runtime project/customer orphans', sql: `SELECT COUNT(*)::int AS count FROM runtime_documents d LEFT JOIN customers c ON c.id::text = d.data->>'customerId' WHERE d.domain = 'Project' AND d.data ? 'customerId' AND c.id IS NULL`, expected: 0 },
  { name: 'runtime machine/project orphans', sql: `SELECT COUNT(*)::int AS count FROM runtime_documents d LEFT JOIN runtime_documents p ON p.domain = 'Project' AND p.id::text = d.data->>'projectId' WHERE d.domain = 'Machine' AND p.id IS NULL`, expected: 0 },
  { name: 'runtime task/project orphans', sql: `SELECT COUNT(*)::int AS count FROM runtime_documents d LEFT JOIN runtime_documents p ON p.domain = 'Project' AND p.id::text = d.data->>'projectId' WHERE d.domain = 'Task' AND p.id IS NULL`, expected: 0 },
];

async function validate() {
  await dataSource.initialize();
  if (await dataSource.showMigrations()) throw new Error('Pending PostgreSQL migrations detected');

  for (const check of checks) {
    const [row] = await dataSource.query(check.sql) as Array<{ count: number }>;
    if (Number(row.count) !== check.expected) {
      throw new Error(`${check.name}: expected ${check.expected}, found ${row.count}`);
    }
    console.log(`PASS ${check.name}`);
  }
  console.log(`PostgreSQL validation complete (${checks.length}/${checks.length} checks passed).`);
}

validate().then(() => dataSource.destroy()).catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
