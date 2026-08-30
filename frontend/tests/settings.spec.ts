import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

const mockDepartments = [
  { _id: 'dept-1', name: 'Mechanical Engineering', code: 'MECH', description: 'Structural and motion design', isActive: true },
  { _id: 'dept-2', name: 'Electrical Engineering', code: 'ELEC', description: 'Power and controls wiring', isActive: true },
  { _id: 'dept-3', name: 'Procurement', code: 'PROC', description: '', isActive: true },
];

const mockNotifPrefs = {
  assignment: true, due_reminder: true, overdue: false, status_change: true,
};

const mockPermissions = [
  { _id: 'permission-1', code: 'items.manage', module: 'Items', action: 'Manage', isActive: true },
  { _id: 'permission-2', code: 'organization.manage', module: 'Organization', action: 'Manage', isActive: true },
];

async function installSettingsMocks(page: import('@playwright/test').Page) {
  await installApiMocks(page);

  // Mutable copy for in-test mutations
  const depts = mockDepartments.map((d) => ({ ...d }));

  await page.route('http://localhost:4051/api/departments', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(depts) });
    } else if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() as any;
      const created = { _id: 'dept-new', isActive: true, ...payload };
      depts.unshift(created);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
    } else {
      await route.continue();
    }
  });

  await page.route('http://localhost:4051/api/departments/**', async (route) => {
    const method = route.request().method();
    const id = route.request().url().split('/departments/')[1];
    if (method === 'PATCH') {
      const payload = route.request().postDataJSON() as any;
      const idx = depts.findIndex((d) => d._id === id);
      if (idx !== -1) Object.assign(depts[idx], payload);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(depts[idx] ?? {}) });
    } else if (method === 'DELETE') {
      const idx = depts.findIndex((d) => d._id === id);
      if (idx !== -1) depts.splice(idx, 1);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Department deleted' }) });
    } else {
      await route.continue();
    }
  });

  await page.route('http://localhost:4051/api/settings/notification_preferences', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ key: 'notification_preferences', value: mockNotifPrefs }) });
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ key: 'notification_preferences', value: route.request().postDataJSON() }) });
    } else {
      await route.continue();
    }
  });

  await page.route('http://localhost:4051/api/permissions/matrix', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      permissions: mockPermissions,
      assignments: mockPermissions.map((permission) => ({ role: 'admin', permissionId: permission._id, allowed: true })),
    }) });
  });

  await page.route('http://localhost:4051/api/permissions/roles/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ permissions: mockPermissions, assignments: [] }) });
  });

  const documentTypes: any[] = [];
  await page.route('http://localhost:4051/api/document-types', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(documentTypes) });
    } else {
      const payload = route.request().postDataJSON() as any;
      const created = { _id: 'document-type-1', isActive: true, nextNumber: String(payload.nextNumber), ...payload };
      documentTypes.push(created);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
    }
  });
}

// ─── Departments tab ──────────────────────────────────────────────────────────

test.describe('Settings — Departments tab', () => {
  test.beforeEach(async ({ page }) => {
    await installSettingsMocks(page);
    await setAuthenticatedSession(page);
    await page.goto('/admin/settings');
  });

  test('renders heading and Departments tab by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Departments' })).toBeVisible();
  });

  test('lists all departments in the table', async ({ page, isMobile }) => {
    if (isMobile) {
      await expect(page.locator('.card').filter({ hasText: 'Mechanical Engineering' }).first()).toBeVisible();
      await expect(page.locator('.card').filter({ hasText: 'Electrical Engineering' }).first()).toBeVisible();
    } else {
      await expect(page.getByRole('cell', { name: 'Mechanical Engineering' })).toBeVisible();
      await expect(page.locator('table').getByText('MECH', { exact: true })).toBeVisible();
      await expect(page.locator('table').getByText('ELEC', { exact: true })).toBeVisible();
    }
  });

  test('opens Add Department modal and creates a department', async ({ page, isMobile }) => {
    await page.getByRole('button', { name: 'Add Department' }).click();
    const modal = page.locator('[role="dialog"], .fixed.inset-0').last();
    await expect(modal.getByText('Add Department')).toBeVisible();

    await page.getByLabel('Name').fill('Controls Engineering');
    await page.getByLabel('Code').fill('ctrl');
    await page.getByLabel('Description').fill('PLC and motion control');
    await page.getByRole('button', { name: 'Create' }).click();

    if (isMobile) {
      await expect(page.locator('.card').filter({ hasText: 'Controls Engineering' }).first()).toBeVisible();
    } else {
      await expect(page.locator('table').getByText('Controls Engineering', { exact: true })).toBeVisible();
    }
  });

  test('validates required name field in Add modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Department' }).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Department name is required')).toBeVisible();
  });

  test('opens Edit modal pre-filled and saves changes', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.locator('.card').filter({ hasText: 'Mechanical Engineering' }).getByRole('button').first().click();
    } else {
      await page.locator('tr').filter({ hasText: 'Mechanical Engineering' }).getByTitle('Edit').click();
    }
    const dialog = page.locator('.fixed.inset-0').last();
    await expect(dialog.getByLabel('Name')).toHaveValue('Mechanical Engineering');
    await dialog.getByLabel('Name').fill('Mechanical Design');
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    if (isMobile) {
      await expect(page.locator('.card').filter({ hasText: 'Mechanical Design' }).first()).toBeVisible();
    } else {
      await expect(page.locator('table').getByText('Mechanical Design', { exact: true })).toBeVisible();
    }
  });

  test('deletes a department after confirming the dialog', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.locator('.card').filter({ hasText: 'Procurement' }).getByRole('button').last().click();
    } else {
      await page.locator('tr').filter({ hasText: 'Procurement' }).getByTitle('Delete').click();
    }
    await expect(page.getByText(/Delete.*Procurement/)).toBeVisible();
    await page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('tbody tr').filter({ hasText: 'Procurement' })).toHaveCount(0);
  });

  test('cancels deletion and keeps the department', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.locator('.card').filter({ hasText: 'Procurement' }).getByRole('button').last().click();
    } else {
      await page.locator('tr').filter({ hasText: 'Procurement' }).getByTitle('Delete').click();
    }
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('tbody tr').filter({ hasText: 'Procurement' })).toHaveCount(1);
  });
});

// ─── Notifications tab ────────────────────────────────────────────────────────

test.describe('Settings — Notifications tab', () => {
  test.beforeEach(async ({ page }) => {
    await installSettingsMocks(page);
    await setAuthenticatedSession(page);
    await page.goto('/admin/settings');
    await page.getByRole('button', { name: /Notifications/i }).click();
  });

  test('renders all supported notification toggles', async ({ page }) => {
    for (const label of ['Task Assignment', 'Due Date Reminder', 'Overdue Alerts', 'Status Changes']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('loads persisted preferences — disabled toggles are off', async ({ page }) => {
    const overdueToggle = page.getByRole('switch', { name: /Overdue Alerts/i });
    await expect(overdueToggle).toHaveAttribute('aria-checked', 'false');
    const assignmentToggle = page.getByRole('switch', { name: /Task Assignment/i });
    await expect(assignmentToggle).toHaveAttribute('aria-checked', 'true');
  });

  test('toggling a switch changes its state', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: /Overdue Alerts/i });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('Save Preferences shows confirmation', async ({ page }) => {
    await page.getByRole('button', { name: 'Save Preferences' }).click();
    await expect(page.getByText('Saved')).toBeVisible();
  });
});

// ─── Platform tab ─────────────────────────────────────────────────────────────

test.describe('Settings — Platform tab', () => {
  test.beforeEach(async ({ page }) => {
    await installSettingsMocks(page);
    await setAuthenticatedSession(page);
    await page.goto('/admin/settings');
    await page.getByRole('button', { name: /Platform/i }).click();
  });

  test('displays stack information rows', async ({ page }) => {
    await expect(page.getByText('MachineIQ — ERP for Machine Builders')).toBeVisible();
    await expect(page.getByText('2.1.0-rc.1')).toBeVisible();
    await expect(page.getByText('support@machineiq.com')).toBeVisible();
  });

  test('displays release status', async ({ page }) => {
    await expect(page.getByText('In development — not yet released')).toBeVisible();
  });
});

test.describe('Settings — Release 1 administration', () => {
  test.beforeEach(async ({ page }) => {
    await installSettingsMocks(page);
    await setAuthenticatedSession(page);
    await page.goto('/admin/settings');
  });

  test('loads and saves the permission matrix', async ({ page }) => {
    await page.getByRole('button', { name: 'Permissions' }).click();
    await expect(page.getByText('items.manage')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Admin: Items Manage' })).toBeChecked();
    await page.getByRole('button', { name: 'Save Admin' }).click();
  });

  test('creates a document type', async ({ page }) => {
    await page.getByRole('button', { name: 'Document Types' }).click();
    await page.getByRole('button', { name: 'New Document Type' }).click();
    await page.getByLabel('Code').fill('quote');
    await page.getByLabel('Name').fill('Quote');
    await page.getByLabel('Prefix').fill('qte');
    await page.getByRole('button', { name: 'Create Document Type' }).click();
    await expect(page.getByText('Quote', { exact: true })).toBeVisible();
    await expect(page.getByText('QTE', { exact: true })).toBeVisible();
  });
});
