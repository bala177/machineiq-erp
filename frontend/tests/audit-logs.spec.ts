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
            {
              _id: 'audit-2',
              action: 'login',
              entityType: 'Account',
              entityId: '11111111-1111-4111-a111-111111111111',
              performedBy: 'user-1',
              performer: { firstName: 'Release', lastName: 'Admin', email: 'admin@machineiq.local' },
              ipAddress: '203.0.113.8',
              createdAt: '2026-09-01T09:00:00.000Z',
            },
          ],
          total: 2,
          page: 1,
          limit: 50,
          pages: 1,
        }),
      });
    });
    await setAuthenticatedSession(page);
    await page.goto('/admin/audit-logs');
  });

  test('shows a compact activity table with logins and expandable field changes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Activity History' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'When' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Action' })).toBeVisible();
    const changedRecord = page.getByRole('row').filter({ hasText: 'Automation' });
    await expect(changedRecord.getByText('Release Admin')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Signed in' })).toBeVisible();
    await changedRecord.getByRole('button', { name: 'View details for Updated Department “Automation”' }).click();
    await expect(page.getByText('Previous value', { exact: true })).toBeVisible();
    await expect(page.getByText('New value', { exact: true })).toBeVisible();
    await expect(page.getByText('Controls')).toBeVisible();
  });

  test('sends entity and action filters to the API', async ({ page }) => {
    const requestPromise = page.waitForRequest((request) => request.url().includes('/audit-logs/all') && request.url().includes('entityType=Department') && request.url().includes('action=update'));
    await page.getByLabel('Business area', { exact: true }).selectOption('Department');
    await page.getByLabel('Activity', { exact: true }).selectOption('update');
    await requestPromise;
  });
});
