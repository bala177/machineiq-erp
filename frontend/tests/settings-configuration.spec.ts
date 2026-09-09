import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
  await setAuthenticatedSession(page);
});

test('searches settings and opens the current sales configuration', async ({ page }) => {
  await page.goto('/admin/settings');
  await page.getByRole('searchbox', { name: 'Search settings' }).fill('approval');
  await expect(page.getByRole('link', { name: /Sales configuration/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Organization profile/ })).toHaveCount(0);
  await page.getByRole('searchbox').fill('no-matching-setting');
  await expect(page.getByRole('status')).toContainText('No settings match');
});

test('item preferences stay in Settings and change new-item behavior', async ({ page }) => {
  let preferences = { salesEnabled: true, purchaseEnabled: true, isStockItem: true, taxPercent: 0, requireHsnSac: false };
  await page.route('**/api/items/preferences', route => route.fulfill({ json: preferences }));
  await page.route('**/api/settings/item_preferences', async route => {
    preferences = route.request().postDataJSON().value;
    await route.fulfill({ json: { value: preferences } });
  });
  await page.goto('/admin/settings');
  await expect(page.getByRole('region', { name: 'Module preferences' }).locator('a[href="/items"]')).toHaveCount(0);
  await page.getByRole('link', { name: /Item preferences/ }).click();
  await expect(page).toHaveURL(/\/admin\/settings\?tab=items/);
  await page.getByLabel('Default item tax rate (%)').fill('12');
  await page.getByLabel('Require HSN / SAC code', { exact: true }).check();
  await page.getByRole('button', { name: 'Save item preferences' }).click();
  await expect(page.getByRole('status')).toHaveText('Item preferences saved');
  await page.reload();
  await expect(page.getByLabel('Default item tax rate (%)')).toHaveValue('12');
  await page.goto('/items');
  await page.getByRole('button', { name: /New item/i }).click();
  await page.getByLabel(/Item name/).fill('Configured component');
  await page.getByRole('button', { name: 'Create item', exact: true }).click();
  await expect(page.getByText('HSN / SAC code is required by item preferences.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tax rate', { exact: false })).toHaveValue('12');
});

test('rejects incomplete item preferences instead of showing editable defaults', async ({ page }) => {
  await page.route('**/api/items/preferences', route => route.fulfill({ json: { salesEnabled: true, taxPercent: 0 } }));
  await page.goto('/admin/settings?tab=items');
  await expect(page.getByRole('alert').filter({ hasText: 'Item preferences are unavailable or invalid' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save item preferences' })).toHaveCount(0);
});

test('retains notification edits when switching settings tabs', async ({ page }) => {
  await page.route('**/api/settings/notification_preferences', route => route.fulfill({ json: { value: { assignment: true, status_change: true, due_reminder: true, overdue: true } } }));
  await page.goto('/admin/settings?tab=notifications');
  await page.getByRole('switch', { name: 'Overdue Alerts' }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Overdue Alerts' })).toHaveAttribute('aria-checked', 'false');
});

test('saves sales settings to the active workflow and restores them after reload', async ({ page }) => {
  let settings = { separate_approver: true, currencies: { INR: 2 } as Record<string, number>, taxes: [0, 18], prefixes: { enquiry: 'ENQ', quote: 'QTE', order: 'SO', project: 'PRJ' } };
  await page.route('**/api/sales/config', route => route.fulfill({ json: { settings, permissions: ['view', 'administer'] } }));
  await page.route('**/api/sales/settings', async route => {
    settings = route.request().postDataJSON();
    await route.fulfill({ json: settings });
  });
  await page.goto('/admin/settings?tab=sales');
  await page.getByLabel('New currency code').fill('EUR');
  await page.getByRole('button', { name: 'Add currency' }).click();
  await page.getByLabel('Quotation prefix').fill('offer');
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.getByRole('button', { name: 'Sales configuration', exact: true }).click();
  await expect(page.getByLabel('Quotation prefix')).toHaveValue('OFFER');
  await page.getByRole('button', { name: 'Save sales configuration' }).click();
  await expect(page.getByRole('status')).toHaveText('Sales configuration saved');
  expect(settings.currencies.EUR).toBe(2);
  expect(settings.prefixes.quote).toBe('OFFER');
  await page.reload();
  await expect(page.getByLabel('EUR decimal places')).toHaveValue('2');
  await expect(page.getByLabel('Quotation prefix')).toHaveValue('OFFER');
});

test('keeps edits on a failed save and offers discard', async ({ page }) => {
  await page.route('**/api/sales/config', route => route.fulfill({ json: { settings: { separate_approver: true, currencies: { INR: 2 }, taxes: [0], prefixes: { enquiry: 'ENQ', quote: 'QTE', order: 'SO', project: 'PRJ' } }, permissions: ['administer'] } }));
  await page.route('**/api/sales/settings', route => route.fulfill({ status: 500, json: { message: 'Save unavailable' } }));
  await page.goto('/admin/settings?tab=sales');
  await page.getByLabel('Quotation prefix').fill('NEW');
  await page.getByRole('button', { name: 'Save sales configuration' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Save unavailable' })).toBeVisible();
  await expect(page.getByLabel('Quotation prefix')).toHaveValue('NEW');
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.getByLabel('Quotation prefix')).toHaveValue('QTE');
});

test('does not offer to save defaults when loading sales configuration fails', async ({ page }) => {
  await page.route('**/api/sales/config', route => route.fulfill({ status: 503, json: { message: 'Configuration unavailable' } }));
  await page.goto('/admin/settings?tab=sales');
  await expect(page.getByRole('alert').filter({ hasText: 'Configuration unavailable' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save sales configuration' })).toHaveCount(0);
});

test('personal notification changes use the user-scoped endpoint', async ({ page }) => {
  let prefs = { assignment: true, status_change: true, due_reminder: true, overdue: true };
  await page.route('**/api/settings/me/notifications', async route => {
    if (route.request().method() === 'PATCH') prefs = route.request().postDataJSON().value;
    await route.fulfill({ json: { value: prefs } });
  });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await page.getByRole('switch', { name: 'Overdue alerts' }).click();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByText('Preferences saved', { exact: true })).toBeVisible();
  expect(prefs.overdue).toBe(false);
});

test('saves a non-admin profile and keeps password focus while typing', async ({ page }) => {
  await setAuthenticatedSession(page, 'designer');
  let profile: unknown;
  await page.route('**/api/users/me/profile', async route => {
    profile = route.request().postDataJSON();
    await route.fulfill({ json: profile });
  });
  await page.goto('/settings');
  await page.getByLabel('First name', { exact: true }).fill('Alex');
  await page.getByLabel('Last name', { exact: true }).fill('Engineer');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Profile updated', { exact: true })).toBeVisible();
  expect(profile).toEqual({ firstName: 'Alex', lastName: 'Engineer' });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('machineiq_user')!).firstName)).toBe('Alex');
  await page.getByRole('button', { name: 'Security', exact: true }).click();
  const password = page.getByLabel('Current password', { exact: true });
  await password.pressSequentially('TypingWorks123');
  await expect(password).toHaveValue('TypingWorks123');
  await expect(password).toBeFocused();
});

test('overview entries open the section they name', async ({ page }) => {
  await page.goto('/admin/settings');
  await page.getByRole('link', { name: /Organization profile/ }).click();
  await expect(page).toHaveURL(/\/organization\?section=company/);
  await expect(page.getByLabel('Company name')).toBeVisible();
});

test('a settings entry that names a field highlights that field', async ({ page }) => {
  await page.goto('/organization?section=company&focus=baseCurrency');
  const field = page.locator('[data-field="baseCurrency"]');
  await expect(field).toBeVisible();
  await expect(field).toHaveClass(/field-focus-ring/);
});

test('the highlight clears once the user interacts with the page', async ({ page }) => {
  await page.goto('/organization?section=company&focus=baseCurrency');
  const field = page.locator('[data-field="baseCurrency"]');
  await expect(field).toHaveClass(/field-focus-ring/);
  await page.getByLabel('Company name').click();
  await expect(field).not.toHaveClass(/field-focus-ring/);
});

test('an unknown focus value still opens the page', async ({ page }) => {
  await page.goto('/organization?section=company&focus=doesNotExist');
  await expect(page.getByLabel('Company name')).toBeVisible();
});

test('a tab entry can highlight a field inside the tab', async ({ page }) => {
  await page.route('**/api/items/preferences', route => route.fulfill({ json: { salesEnabled: true, purchaseEnabled: true, isStockItem: true, taxPercent: 0, requireHsnSac: false } }));
  await page.goto('/admin/settings?tab=items&focus=requireHsnSac');
  const field = page.locator('[data-field="requireHsnSac"]');
  await expect(field).toBeVisible();
  await expect(field).toHaveClass(/field-focus-ring/);
});

test('changing tab by hand drops a stale highlight target', async ({ page }) => {
  await page.route('**/api/items/preferences', route => route.fulfill({ json: { salesEnabled: true, purchaseEnabled: true, isStockItem: true, taxPercent: 0, requireHsnSac: false } }));
  await page.goto('/admin/settings?tab=items&focus=requireHsnSac');
  await page.getByRole('button', { name: 'Platform', exact: true }).click();
  await expect(page).toHaveURL(/tab=platform/);
  await expect(page).not.toHaveURL(/focus=/);
});
