import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('shows admin navigation and visits each main area on desktop', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only navigation assertions');
  await setAuthenticatedSession(page);
  await page.goto('/dashboard');
  const sidebar = page.locator('aside');

  for (const label of ['Dashboard', 'Items', 'Customers', 'Suppliers', 'Organization', 'Users', 'Settings']) {
    await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible();
  }

  await sidebar.getByRole('link', { name: 'Customers', exact: true }).click();
  await expect(page).toHaveURL(/\/customers$/);

  await sidebar.getByRole('link', { name: 'Users', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
});

test('hides admin navigation for non-admin users', async ({ page }) => {
  await setAuthenticatedSession(page, 'designer');
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
});

test('shows role-specific navigation for each core role', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only navigation assertions');

  const cases = [
    { role: 'manager' as const, visible: ['Dashboard', 'Items', 'Customers', 'Suppliers', 'Organization'], hidden: ['Users', 'Settings'] },
    { role: 'sales' as const, visible: ['Dashboard', 'Customers'], hidden: ['Items', 'Suppliers', 'Organization', 'Users', 'Settings'] },
    { role: 'designer' as const, visible: ['Dashboard', 'Items'], hidden: ['Customers', 'Suppliers', 'Organization', 'Users', 'Settings'] },
    { role: 'leadership' as const, visible: ['Dashboard', 'Items', 'Customers', 'Suppliers', 'Organization'], hidden: ['Users', 'Settings'] },
  ];

  for (const item of cases) {
    await setAuthenticatedSession(page, item.role);
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');

    for (const label of item.visible) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible();
    }

    for (const label of item.hidden) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    }

    await page.evaluate(() => localStorage.clear());
  }
});

test('supports mobile menu navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-only navigation assertions');
  await setAuthenticatedSession(page);
  await page.goto('/dashboard');

  await page
    .getByRole('button')
    .filter({ has: page.locator('svg.lucide-menu') })
    .click();
  await page.locator('aside').getByRole('link', { name: 'Customers', exact: true }).click();
  await expect(page).toHaveURL(/\/customers$/);
});

test('collapses the desktop sidebar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only sidebar behavior');
  await setAuthenticatedSession(page);
  await page.goto('/dashboard');
  await page.getByTitle('Collapse sidebar').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTitle('Expand sidebar')).toBeVisible();
});

test('keeps account identity in the navbar instead of duplicating it in the sidebar', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop navbar identity assertion');
  await setAuthenticatedSession(page);
  await page.goto('/dashboard');

  await expect(page.locator('header').getByText('Ava Admin', { exact: true })).toBeVisible();
  await expect(page.locator('aside').getByText('Ava Admin', { exact: true })).toHaveCount(0);
});

test('support pages share current release-candidate identity and fit the viewport', async ({ page }) => {
  await setAuthenticatedSession(page);

  await page.goto('/help');
  await expect(page.getByRole('heading', { name: 'Release 1 Help & FAQ' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();

  await page.goto('/about');
  await expect(page.getByText(/Release candidate · v2\.1\.0-rc\.2/).first()).toBeVisible();
  await expect(page.getByText('Currently in Release candidate')).toBeVisible();

  await page.goto('/about/release-notes');
  await expect(page.getByRole('heading', { name: 'Release Notes' })).toBeVisible();
  await expect(page.getByText('v2.1.0-rc.2', { exact: true })).toBeVisible();

  for (const route of ['/help', '/about', '/about/release-notes']) {
    await page.goto(route);
    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(fitsViewport, `${route} should not overflow horizontally`).toBe(true);
  }
});
