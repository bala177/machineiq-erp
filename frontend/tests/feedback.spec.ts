import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page, { feedbackEnabled: true });
  await setAuthenticatedSession(page);
});

test('submits feedback and exposes it in customer and admin views', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Feedback Center' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Report issue or idea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Report an issue or idea' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Suggestion' }).click();
  await dialog.getByRole('textbox', { name: /^Tell us what happened/ }).fill('Add a faster way to duplicate an item record.');
  await dialog.getByRole('button', { name: 'Minor' }).click();
  await dialog.getByRole('button', { name: 'Send feedback', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Report received' })).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();

  await page.goto('/feedback');
  await expect(page.getByText('Add a faster way to duplicate an item record.')).toBeVisible();
  await expect(page.getByText('Suggestion', { exact: true })).toBeVisible();

  await page.goto('/admin/feedback');
  await expect(page.getByRole('heading', { name: 'Feedback Center' })).toBeVisible();
  await expect(page.getByText('Add a faster way to duplicate an item record.').first()).toBeVisible();
  // Anchored on the prefix to tell the triage select apart from the
  // "Feedback status filter" select above the list.
  await page.getByLabel(/^Status/).selectOption('planned');
  await page.getByLabel('Target release').last().fill('2.2.0');
  await page.getByLabel(/^Reply to the reporter/).fill('Planned for the next Release 1 update.');
  await page.getByRole('button', { name: 'Save feedback' }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();

  await page.goto('/feedback');
  await expect(page.getByText('Planned for the next Release 1 update.')).toBeVisible();
});

test('offers section-specific quick reports and a full-width optional description', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Report issue or idea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Report an issue or idea' });
  await expect(dialog.getByLabel('Which section?', { exact: true })).toHaveValue('Dashboard');
  await dialog.getByLabel('Which section?', { exact: true }).selectOption('Sales reports');
  await dialog.getByRole('button', { name: 'Report totals look wrong', exact: true }).click();
  const description = dialog.getByRole('textbox', { name: /^Tell us what happened/ });
  await expect(description).toHaveValue('');
  const widthRatio = await description.evaluate(element => element.getBoundingClientRect().width / element.parentElement!.getBoundingClientRect().width);
  expect(widthRatio).toBeGreaterThan(0.98);
  await expect(dialog.getByText('(optional details)', { exact: true })).toBeVisible();
  await page.screenshot({ path: `playwright-results/feedback-guided-${test.info().project.name}.png` });
  await dialog.getByRole('button', { name: 'Send feedback', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Report received' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Open Feedback Center', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/feedback$/);
  await expect(page.getByText(/Section: Sales reports\s+Issue: Report totals look wrong/).first()).toBeVisible();
});

test('keeps feedback controls hidden when the server disables collection', async ({ page }) => {
  await installApiMocks(page, { feedbackEnabled: false });
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Report issue or idea' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Feedback Center' })).toHaveCount(0);
});

test('keeps the target release filter caption clear of its input', async ({ page }) => {
  await page.goto('/admin/feedback');
  const caption = page.getByText('Target release', { exact: true }).first();
  const input = page.getByLabel('Target release').first();

  const captionBox = await caption.boundingBox();
  const inputBox = await input.boundingBox();

  expect(captionBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  // The caption must sit entirely above the field rather than printing over it.
  expect(captionBox!.y + captionBox!.height).toBeLessThanOrEqual(inputBox!.y + 1);
});

test('says what a status needs before it will let the admin save', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Report issue or idea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Report an issue or idea' });
  await dialog.getByRole('textbox', { name: /^Tell us what happened/ }).fill('The item list loses my filter.');
  await dialog.getByRole('button', { name: 'Send feedback', exact: true }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  await page.goto('/admin/feedback');
  await page.getByLabel(/^Status/).selectOption('fixed');

  const save = page.getByRole('button', { name: 'Save feedback' });
  await expect(save).toBeDisabled();
  await expect(page.getByText('needs a reply the reporter can read').first()).toBeVisible();

  await page.getByLabel(/^Reply to the reporter/).fill('Corrected in this build.');

  await expect(save).toBeEnabled();
  await expect(page.getByText('needs a reply the reporter can read')).toHaveCount(0);
});

test('picks up feedback sent from another screen when the tab regains focus', async ({ page }) => {
  await page.goto('/admin/feedback');
  await expect(page.getByText('The reports page will not open on my tablet.')).toHaveCount(0);

  await page.getByRole('button', { name: 'Report issue or idea' }).click();
  const dialog = page.getByRole('dialog', { name: 'Report an issue or idea' });
  await dialog.getByRole('textbox', { name: /^Tell us what happened/ }).fill('The reports page will not open on my tablet.');
  await dialog.getByRole('button', { name: 'Send feedback', exact: true }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  // Stands in for the live socket signal, which the mocked API cannot send:
  // the same listener refetches whenever the tab is focused again.
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));

  await expect(page.getByText('The reports page will not open on my tablet.').first()).toBeVisible();
});
