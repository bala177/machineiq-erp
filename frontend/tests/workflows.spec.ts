import { expect, test } from '@playwright/test';
import { installApiMocks, loginThroughUi, setAuthenticatedSession } from './fixtures/test-helpers';

test.describe('core workflows', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
  });

  test('renders the operational admin dashboard when setup is complete', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/dashboard');

    await expect(page.getByText('Customers').first()).toBeVisible();
    await expect(page.getByText('Suppliers').first()).toBeVisible();
    await expect(page.getByText('Items').first()).toBeVisible();
    await expect(page.getByText('Active users').first()).toBeVisible();
    await expect(page.getByText('Organization setup complete')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Master data status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Team and access' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick actions' })).toBeVisible();
    await expect(page.getByText('Release 1 scope')).toHaveCount(0);
    await expect(page.getByText('Machine Inquiries')).toHaveCount(0);
    await expect(page.getByText('By Priority')).toHaveCount(0);
  });

  test('guides the administrator to the next incomplete setup step', async ({ page }) => {
    await page.route('**/api/organization/branches', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await setAuthenticatedSession(page);
    await page.goto('/dashboard');

    await expect(page.getByText('Setup in progress')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next: Operating branch' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Add an operating branch/ })).toBeVisible();
    await expect(page.getByText('Organization setup complete')).toHaveCount(0);

    await page.getByRole('link', { name: /Add an operating branch/ }).click();
    await expect(page).toHaveURL(/\/organization\?section=branches/);
    await expect(page.getByRole('tab', { name: /Operating branch/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('filters opportunities and opens the detail page', async ({ page, isMobile }) => {
    await setAuthenticatedSession(page);
    await page.goto('/opportunities');
    await page.getByRole('combobox').selectOption('approved');
    if (isMobile) {
      await expect(page.locator('main').filter({ hasText: 'Case Packer Revamp' }).first()).toBeVisible();
    } else {
      await expect(page.locator('tbody').getByRole('link', { name: 'Case Packer Revamp' })).toBeVisible();
    }

    await page.goto('/opportunities/opp-2');
    await expect(page).toHaveURL(/\/opportunities\/opp-2$/);
    await expect(page.getByRole('link', { name: 'Convert to Project' }).first()).toBeVisible();
  });

  test('moves an opportunity through review, feasibility, and approval', async ({ page }) => {
    await setAuthenticatedSession(page, 'manager');
    await page.goto('/opportunities/opp-4');

    await expect(page.getByRole('heading', { name: 'Request Workflow' })).toBeVisible();
    await expect(page.getByText('New').first()).toBeVisible();

    await page.getByRole('button', { name: 'Send to review' }).click();
    await expect(page.getByText('Under Review').first()).toBeVisible();

    await page.getByRole('button', { name: 'Start feasibility' }).click();
    await expect(page.getByText('Feasibility In Progress').first()).toBeVisible();

    await page.getByLabel(/Feasibility notes/i).fill('Feasible with the existing tester frame and controls platform.');
    await page.getByLabel(/Complexity notes/i).fill('Moderate complexity due to clone validation and fixture repeatability.');
    await page.getByLabel(/Risk notes/i).fill('Main risk is fixture supplier lead time; mitigation is early PO release.');
    await page.getByRole('combobox', { name: 'Feasibility', exact: true }).selectOption('feasible');
    await page.getByRole('combobox', { name: 'Complexity', exact: true }).selectOption('medium');
    await page.getByRole('combobox', { name: 'Risk', exact: true }).selectOption('medium');
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByText('Approved').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Convert to Project' }).first()).toBeVisible();
  });

  test('allows managers to enter review notes while an opportunity is still draft', async ({ page }) => {
    await setAuthenticatedSession(page, 'manager');
    await page.goto('/opportunities/opp-5');

    await expect(page.getByText('Draft').first()).toBeVisible();

    await page.getByLabel(/Feasibility notes/i).fill('Need site photos and cycle assumptions before feasibility.');
    await page.getByRole('button', { name: 'Save feasibility notes' }).click();

    await expect(page.getByLabel(/Feasibility notes/i)).toHaveValue('Need site photos and cycle assumptions before feasibility.');
  });

  test('creates an opportunity through the form flow', async ({ page }) => {
    await installApiMocks(page);
    await setAuthenticatedSession(page);
    await page.goto('/opportunities/new');

    // Step 1: select a customer
    await page.getByRole('combobox', { name: 'Search by company name…' }).click();
    await page.getByRole('button', { name: 'Atlas Foods' }).click();
    await page.getByRole('button', { name: /Next.*Choose machine/i }).click();

    // Step 2: leave blank request selected, add a title
    await page.getByPlaceholder(/Custom filling line/i).fill('Bottle Handler');
    await page.getByRole('button', { name: /Create request/i }).click();

    await expect(page).toHaveURL(/\/opportunities\/opp-created$/);
  });

  test('surfaces create-opportunity backend validation errors', async ({ page }) => {
    await installApiMocks(page, { formFailures: { opportunity: 'Title already exists' } });
    await setAuthenticatedSession(page);
    await page.goto('/opportunities/new');

    // Step 1: select a customer
    await page.getByRole('combobox', { name: 'Search by company name…' }).click();
    await page.getByRole('button', { name: 'Atlas Foods' }).click();
    await page.getByRole('button', { name: /Next.*Choose machine/i }).click();

    // Step 2: submit — triggers backend failure on /opportunities/with-customer
    await page.getByRole('button', { name: /Create request/i }).click();
    await expect(page.getByText('Title already exists')).toBeVisible();
  });

  test('converts an opportunity into a prefilled project form and creates the project', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/opportunities/opp-2');
    await page.getByRole('link', { name: 'Convert to Project' }).click();

    await expect(page).toHaveURL(/\/projects\/new\?opportunityId=opp-2$/);
    await expect(page.getByLabel('Project Name')).toHaveValue('Case Packer Revamp');
    await expect(page.getByLabel('Customer')).toHaveValue('cust-b');

    await page.getByRole('button', { name: 'Convert to Project' }).click();
    await expect(page).toHaveURL(/\/projects\/proj-created$/);
    await expect(page.getByText('Case Packer Revamp')).toBeVisible();
  });

  test('renders project detail execution snapshot', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/projects/proj-1');

    await expect(page.getByRole('heading', { name: 'Active Blockers' })).toBeVisible();
    await expect(page.getByText('Ready for Procurement')).toBeVisible();
    await expect(page.getByText('Atlas Line 7 Upgrade')).toBeVisible();
    await expect(page.getByText('Freeze line layout by May 1')).toBeVisible();
  });

  test('navigates the integrated project workspace tabs', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/projects/proj-1');

    await page.getByRole('button', { name: 'Machine Architecture', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Primary Cartoner' })).toBeVisible();
    await expect(page.getByText('Infeed').first()).toBeVisible();

    await page.getByRole('button', { name: 'Tasks' }).first().click();
    await expect(page.getByText('Execution Tasks')).toBeVisible();
    await expect(page.getByText('Issue timing screw detail drawings')).toBeVisible();

    await page.getByRole('button', { name: 'Procurement' }).first().click();
    await expect(page.getByText('Component Procurement Queue')).toBeVisible();
    await expect(page.getByText('Servo drive kit')).toBeVisible();

    await page.getByRole('button', { name: 'Decisions' }).first().click();
    await expect(page.getByRole('heading', { name: 'Decision Log' })).toBeVisible();
    await expect(page.getByText('Control cabinet split')).toBeVisible();
  });

  test('filters projects to an empty state', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/projects');
    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page.getByText('No projects found')).toBeVisible();
  });

  test('switches tasks between list and kanban views', async ({ page, isMobile }) => {
    await setAuthenticatedSession(page);
    await page.goto('/tasks');

    if (isMobile) {
      await expect(page.locator('main p').filter({ hasText: 'Issue timing screw detail drawings' })).toBeVisible();
    } else {
      await expect(page.locator('tbody').getByRole('cell', { name: 'Issue timing screw detail drawings' })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Board' }).click();
    await expect(page.locator('main').getByText('Finalize infeed layout').first()).toBeVisible();
  });

  test('opens the machine architecture structure view', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/machines');

    await expect(page.getByRole('button', { name: /Primary Cartoner/ }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Structure', exact: true }).click();
    await expect(page.getByText('Infeed').first()).toBeVisible();
    await expect(page.getByText('Flight Conveyor').first()).toBeVisible();
    await page.getByText('Flight Conveyor').first().click();
    await expect(page.getByText('Servo timing shaft').first()).toBeVisible();
  });

  test('creates a component and advances it through design, procurement, and assembly statuses', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/machines');

    await page.getByRole('button', { name: 'Components', exact: true }).click();
    await page.getByPlaceholder('Component name').fill('Drive shaft');
    await page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Mechanical' }) })
      .first()
      .selectOption('Mechanical');
    await page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Eli Engineer' }) })
      .first()
      .selectOption('user-eng');
    await page.locator('input[type="date"]').fill('2026-06-18');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Drive shaft')).toBeVisible();
    const row = page.locator('tr').filter({ hasText: 'Drive shaft' });
    await row.locator('select').nth(0).selectOption('Released');
    await row.locator('select').nth(1).selectOption('Received');
    await row.locator('select').nth(2).selectOption('Installed');
    await expect(row.locator('select').nth(2)).toHaveValue('Installed');
  });

  test('shows blocked and delayed component signals on the project dashboard', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/projects/proj-1');

    await expect(page.getByText('Blocked Components')).toBeVisible();
    await expect(page.getByText('Delayed Components')).toBeVisible();
    await expect(page.getByText('Infeed rail kit')).toBeVisible();
  });

  test('coordinates a module from deliverables through procurement release', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/projects/proj-1');

    await page.getByRole('button', { name: 'Machine Architecture', exact: true }).click();
    await expect(page.getByRole('button', { name: /Infeed Primary Cartoner/ })).toBeVisible();
    await page.getByRole('button', { name: /Infeed Primary Cartoner/ }).click();

    await expect(page.getByRole('heading', { name: 'Infeed' })).toBeVisible();
    await expect(page.getByText('Release checks still open')).toBeVisible();
    await page.getByText('Issue timing screw detail drawings').click();
    await expect(page.getByText('Ready for procurement release')).toBeVisible();

    await page.getByRole('button', { name: 'Overview' }).nth(1).click();
    await page.getByRole('button', { name: 'Release to Procurement' }).click();
    await expect(page.getByRole('heading', { name: 'Infeed' })).toBeVisible();
  });

  test('shows procurement metrics, filter behavior, and long lead state', async ({ page, isMobile }) => {
    await setAuthenticatedSession(page);
    await page.goto('/procurement');

    await expect(page.getByText('Changed After Release').nth(0)).toBeVisible();
    if (isMobile) {
      await expect(page.locator('main p').filter({ hasText: 'Servo drive kit' })).toBeVisible();
    } else {
      await expect(page.locator('tbody').getByText('Servo drive kit')).toBeVisible();
    }
    await page.getByRole('button', { name: 'Ordered', exact: true }).click();
    if (isMobile) {
      await expect(page.locator('main p').filter({ hasText: 'Servo drive kit' })).toBeVisible();
    } else {
      await expect(page.locator('tbody').getByText('Servo drive kit')).toBeVisible();
    }
    await expect(page.getByText('Safety relay pack')).toHaveCount(0);
  });

  test('moves released components through the procurement queue', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/procurement');

    await expect(page.getByText('Safety cover').first()).toBeVisible();
    await page.getByRole('button', { name: 'Mark Ordered' }).first().click();
    await expect(page.getByRole('button', { name: 'Mark Received' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Mark Received' }).first().click();
    await expect(page.getByRole('button', { name: 'Mark Installed' }).first()).toBeVisible();
  });

  test('switches documents tabs and renders decisions', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/documents');

    await expect(page.getByText('Kickoff Minutes.pdf')).toBeVisible();
    await page.getByRole('button', { name: 'Decision Log' }).click();
    await expect(page.getByText('Control cabinet split')).toBeVisible();
  });

  test('marks notifications read in bulk', async ({ page }) => {
    await setAuthenticatedSession(page);
    await page.goto('/notifications');

    await expect(page.getByRole('button', { name: /Mark all read/ })).toBeVisible();
    await page.getByRole('button', { name: /Mark all read/ }).click();
    await expect(page.getByRole('button', { name: /Mark all read/ })).toHaveCount(0);
  });

  test('renders admin users and settings pages', async ({ page, isMobile }) => {
    await setAuthenticatedSession(page);
    await page.goto('/admin/users');
    if (isMobile) {
      await expect(page.locator('main p').filter({ hasText: 'admin@machineiq.com' })).toBeVisible();
    } else {
      await expect(page.locator('tbody').getByText('admin@machineiq.com')).toBeVisible();
    }

    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});

test.describe('empty and failure states', () => {
  test('shows empty-state screens across list pages', async ({ page }) => {
    await installApiMocks(page, {
      empty: {
        opportunities: true,
        projects: true,
        tasks: true,
        machines: true,
        procurement: true,
        components: true,
        deliverables: true,
        documents: true,
        decisions: true,
        notifications: true,
        users: true,
      },
    });
    await setAuthenticatedSession(page);

    await page.goto('/opportunities');
    await expect(page.getByText('No machine inquiries found')).toBeVisible();

    await page.goto('/projects');
    await expect(page.getByText('No projects found')).toBeVisible();

    await page.goto('/tasks');
    await expect(page.getByText('No tasks found')).toBeVisible();

    await page.goto('/machines');
    await expect(page.getByText('No machines yet')).toBeVisible();

    await page.goto('/procurement');
    await expect(page.getByText('No procurement items')).toBeVisible();

    await page.goto('/documents');
    await expect(page.getByText('No documents uploaded')).toBeVisible();
    await page.getByRole('button', { name: 'Decision Log' }).click();
    await expect(page.getByText('No decisions recorded')).toBeVisible();

    await page.goto('/notifications');
    await expect(page.getByText("You're all caught up")).toBeVisible();

    await page.goto('/admin/users');
    await expect(page.getByText('No users found')).toBeVisible();
  });

  test('renders detail-page not-found states', async ({ page }) => {
    await installApiMocks(page, { detailNotFound: { opportunity: true, project: true } });
    await setAuthenticatedSession(page);

    await page.goto('/opportunities/missing');
    await expect(page.getByText('Machine inquiry not found')).toBeVisible();

    await page.goto('/projects/missing');
    await expect(page.getByText('Project not found')).toBeVisible();
  });
});
