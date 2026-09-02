import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

test.describe('Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
    await page.route('http://localhost:4051/api/audit-logs/all?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              _id: 'audit-1',
              action: 'update',
              entityType: 'Department',
              entityId: '22222222-2222-4222-a222-222222222222',
              performedBy: 'user-1',
              performer: { firstName: 'Release', lastName: 'Admin', email: 'admin@machineiq.local' },
              previousValues: { name: 'Controls' },
              newValues: { name: 'Automation' },
              ipAddress: '127.0.0.1',
              createdAt: '2026-09-01T10:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 50,
          pages: 1,
        }),
      });
    });
    await setAuthenticatedSession(page);
    await page.goto('/admin/audit-logs');
  });

  test('shows a business-friendly activity summary and field changes', async ({ page, isMobile }) => {
    const record = page.locator('article');
    await expect(page.getByRole('heading', { name: 'Activity History' })).toBeVisible();
    await expect(page.getByText('Protected history')).toBeVisible();
    await expect(record.getByRole('heading', { name: 'Updated Department “Automation”' })).toBeVisible();
    await expect(record.getByText('Release Admin')).toBeVisible();
    await expect(record.getByText('Department', { exact: true })).toBeVisible();
    await record.getByRole('button', { name: 'Review 1 change' }).click();
    await expect(record.getByText(isMobile ? 'Previous' : 'Previous value', { exact: true }).first()).toBeVisible();
    await expect(record.getByText(isMobile ? 'New' : 'New value', { exact: true }).first()).toBeVisible();
    await expect(record.getByText('Controls')).toBeVisible();
    await expect(record.getByText('Automation', { exact: true })).toBeVisible();
  });

  test('sends entity and action filters to the API', async ({ page }) => {
    const requestPromise = page.waitForRequest((request) => request.url().includes('/audit-logs/all') && request.url().includes('entityType=Department') && request.url().includes('action=update'));
    await page.getByLabel('Business area', { exact: true }).selectOption('Department');
    await page.getByLabel('Activity', { exact: true }).selectOption('update');
    await requestPromise;
  });
});
