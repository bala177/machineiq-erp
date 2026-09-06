import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page, { feedbackEnabled: true });
  await setAuthenticatedSession(page);
});

test('submits feedback and exposes it in customer and admin views', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  const dialog = page.getByRole('dialog', { name: 'Help us improve MachineIQ' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Suggestion' }).click();
  await dialog.getByPlaceholder(/What did you try/).fill('Add a faster way to duplicate an item record.');
  await dialog.getByRole('button', { name: 'Minor' }).click();
  await dialog.getByRole('button', { name: 'Send feedback', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thank you' })).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();

  await page.goto('/feedback');
  await expect(page.getByText('Add a faster way to duplicate an item record.')).toBeVisible();
  await expect(page.getByText('Suggestion', { exact: true })).toBeVisible();

  await page.goto('/admin/feedback');
  await expect(page.getByRole('heading', { name: 'Customer Feedback' })).toBeVisible();
  await expect(page.getByText('Add a faster way to duplicate an item record.').first()).toBeVisible();
  await page.getByLabel('Status').selectOption('planned');
  await page.getByLabel('Customer-visible response').fill('Planned for the next Release 1 update.');
  await page.getByRole('button', { name: 'Save feedback' }).click();
  await expect(page.getByRole('button', { name: 'Save feedback' })).toBeEnabled();

  await page.goto('/feedback');
  await expect(page.getByText('Planned for the next Release 1 update.')).toBeVisible();
});

test('keeps feedback controls hidden when the server disables collection', async ({ page }) => {
  await installApiMocks(page, { feedbackEnabled: false });
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Send feedback' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'My Feedback' })).toHaveCount(0);
});
