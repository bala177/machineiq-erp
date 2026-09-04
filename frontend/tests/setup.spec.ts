import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures/test-helpers';

test('redirects the root page directly to setup when no admin exists yet', async ({ page }) => {
  await installApiMocks(page, { needsSetup: true });
  await page.goto('/');
  await expect(page).toHaveURL(/\/setup$/, { timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'Set up your workspace' })).toBeVisible();
});

test('redirects to setup when no admin exists yet', async ({ page }) => {
  await installApiMocks(page, { needsSetup: true });
  await page.goto('/login');
  await expect(page).toHaveURL(/\/setup$/, { timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Set up your workspace' })).toBeVisible();
});

test('does not redirect to setup once an admin exists', async ({ page }) => {
  await installApiMocks(page, { needsSetup: false });
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('redirects away from setup once an admin exists', async ({ page }) => {
  await installApiMocks(page, { needsSetup: false });
  await page.goto('/setup');
  await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
});

test('completes setup and lands on the dashboard', async ({ page }) => {
  await installApiMocks(page, { needsSetup: true });
  await page.goto('/setup');
  await expect(page.getByRole('heading', { name: 'Set up your workspace' })).toBeVisible();

  await page.getByLabel('OEM company name').fill('Acme Machine Works');
  await page.getByLabel(/Machine segment/).fill('Foundry automation');
  await page.getByLabel('First name').fill('Jane');
  await page.getByLabel('Last name').fill('Doe');
  await page.getByLabel('Email address').fill('jane@acme.com');
  await page.getByLabel('Password').fill('SecurePass1');
  await page.getByRole('button', { name: 'Create workspace' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
