import { expect, test } from '@playwright/test';
import { Workbook } from 'exceljs';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

const headers = {
  Company: ['code', 'name', 'industry', 'incorporated_on', 'email', 'phone', 'website', 'cin', 'gstin', 'pan', 'tan', 'msme_number', 'address', 'city', 'state_province', 'postal_code', 'country', 'base_currency', 'timezone', 'fiscal_year_start_month', 'date_format', 'language_code'],
  Directors: ['name', 'designation', 'din', 'email', 'phone', 'shareholding_percent', 'appointed_on'],
  Branches: ['code', 'name', 'tax_registration_number', 'email', 'phone', 'address', 'city', 'state_province', 'postal_code', 'country'],
  Locations: ['code', 'name', 'branch_code', 'type', 'address', 'city', 'state_province', 'postal_code', 'country'],
  Departments: ['code', 'name', 'description'],
};

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
  await setAuthenticatedSession(page);
});

test('shows explicit save and operating-structure actions', async ({ page }) => {
  await page.goto('/organization?section=directors');
  await page.getByRole('button', { name: 'Add director' }).click();
  await expect(page.getByRole('button', { name: 'Save director' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('tab', { name: /Operating branch/ }).click();
  await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
  await page.getByRole('tab', { name: /Physical location/ }).click();
  await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
});

test('previews a workbook before applying its records', async ({ page }) => {
  let creates = 0;
  await page.route('http://localhost:4051/api/organization/directors', async (route) => {
    if (route.request().method() === 'POST') {
      creates++;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'director-new', isActive: true, ...route.request().postDataJSON() }) });
    } else await route.fallback();
  });
  const workbook = new Workbook();
  Object.entries(headers).forEach(([name, columns]) => {
    const sheet = workbook.addWorksheet(name); sheet.addRow(columns);
    if (name === 'Directors') sheet.addRow(['Asha Rao', 'Director', '12345678', 'asha@example.com', '', '25', '2026-01-01']);
  });
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  await page.goto('/organization');
  await page.getByRole('button', { name: 'Import / preview' }).click();
  await page.getByLabel('Organization workbook').setInputFiles({ name: 'organization.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer });
  await expect(page.getByRole('button', { name: 'Apply 1 records' })).toBeVisible();
  expect(creates).toBe(0);
  await page.getByRole('button', { name: 'Apply 1 records' }).click();
  await expect.poll(() => creates).toBe(1);
});
