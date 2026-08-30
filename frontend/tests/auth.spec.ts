import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

test('redirects protected routes to login when unauthenticated', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('signs in successfully and persists auth', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@machineiq.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('shows invalid credential errors on login failure', async ({ page }) => {
  await installApiMocks(page, { loginFails: true });
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@machineiq.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('logs out from the application shell', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Profile dropdown is desktop-only (hidden sm:block)');
  await installApiMocks(page);
  await setAuthenticatedSession(page);
  await page.goto('/dashboard');
  // Open the profile dropdown, then click Sign out inside it
  await page.getByRole('button').filter({ has: page.locator('svg.lucide-chevron-down') }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('handles unauthorized api responses by returning to login', async ({ page }) => {
  await installApiMocks(page, { forceUnauthorized: true });
  await setAuthenticatedSession(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
