import { expect, test } from '@playwright/test';
import { installApiMocks, setAuthenticatedSession } from './fixtures/test-helpers';

const category = { _id: '11111111-1111-4111-8111-111111111111', code: 'ELEC', name: 'Electrical' };
const uom = { _id: '22222222-2222-4222-8222-222222222222', code: 'EA', name: 'Each', conversionFactor: 1 };
const supplier = {
  _id: '33333333-3333-4333-8333-333333333333', code: 'SUP-00001', name: 'Precision Drives',
  contactPerson: 'Priya Shah', email: 'priya@example.com', phone: '+91 90000 00000', address: 'Pune',
  category: 'Motion Control', paymentTerms: 'Net 30', taxRegistrationNumber: 'GST-1', currencyCode: 'INR',
  bankDetails: { bankName: 'Industry Bank', accountName: 'Precision Drives', accountNumber: '1234', ifscSwiftCode: 'TEST0001' },
  qualificationStatus: 'qualified', defaultLeadTimeDays: 21, isActive: true,
};

async function installMasterDataMocks(page: import('@playwright/test').Page) {
  await installApiMocks(page);
  const customers = [{
    _id: 'customer-1', code: 'CUS-00001', name: 'Atlas Automation', displayName: 'Atlas Automation',
    accountType: 'active', customerType: 'business', companySize: '51-200', industry: 'Industrial Automation',
    contactPerson: '', email: 'marta@atlas.example', phone: '+498912345678', mobile: '',
    country: 'Germany', city: 'Munich', stateProvince: 'Bavaria', postalCode: '80331', address: '1 Factory Road',
    secondaryContactName: '', secondaryContactEmail: 'legacy-invalid-email', secondaryContactPhone: '', shippingAddress: '',
    shippingCity: '', shippingStateProvince: '', shippingPostalCode: '', shippingCountry: '', website: '',
    designation: '', department: '', vatNumber: '', taxTreatment: '', placeOfSupply: '', registrationNumber: '',
    paymentTerms: '', currencyCode: 'EUR', creditLimit: '', priceList: '', deliveryTerms: '', notes: null,
  }];
  const suppliers = [{ ...supplier, bankDetails: { ...supplier.bankDetails } }];
  const items = [{
    _id: '44444444-4444-4444-8444-444444444444', code: 'DRV-001', name: 'Servo Drive', description: 'Axis drive',
    categoryId: category, uomId: uom, itemType: 'component', standardCost: 1200, sellingPrice: 1600,
    hsnSac: '8504', taxPercent: 18, isStockItem: true, reorderLevel: 2, defaultSupplierId: supplier,
    leadTimeDays: 21, isActive: true,
  }];

  await page.route('http://localhost:4051/api/items', async (route) => {
    if (route.request().method() === 'POST') {
      const created = { _id: 'item-new', isActive: true, ...route.request().postDataJSON(), categoryId: category, uomId: uom };
      items.push(created);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(items) });
  });
  await page.route('http://localhost:4051/api/items?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(items) });
  });
  await page.route('http://localhost:4051/api/items/categories', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([category]) });
  });
  await page.route('http://localhost:4051/api/items/uoms', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([uom]) });
  });
  await page.route('http://localhost:4051/api/items/*', async (route) => {
    const id = route.request().url().split('/items/')[1];
    if (id === 'categories') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([category]) });
      return;
    }
    if (id === 'uoms') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([uom]) });
      return;
    }
    const item = items.find((record) => record._id === id)!;
    Object.assign(item, route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(item) });
  });

  await page.route('http://localhost:4051/api/suppliers', async (route) => {
    if (route.request().method() === 'POST') {
      const created = { _id: 'supplier-new', code: 'SUP-00002', isActive: true, ...route.request().postDataJSON() };
      suppliers.push(created);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(suppliers) });
  });
  await page.route('http://localhost:4051/api/suppliers?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(suppliers) });
  });
  await page.route('http://localhost:4051/api/suppliers/*', async (route) => {
    const id = route.request().url().split('/suppliers/')[1];
    const record = suppliers.find((entry) => entry._id === id)!;
    Object.assign(record, route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(record) });
  });

  await page.route('http://localhost:4051/api/customers', async (route) => {
    if (route.request().method() === 'POST') {
      const created = { ...route.request().postDataJSON(), _id: 'customer-2', code: 'CUS-00002' };
      customers.push(created);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(customers) });
  });
  await page.route('http://localhost:4051/api/customers?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(customers) });
  });
  await page.route('http://localhost:4051/api/customers/*', async (route) => {
    const id = route.request().url().split('/customers/')[1];
    const record = customers.find((entry) => entry._id === id)!;
    Object.assign(record, route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(record) });
  });
}

test.beforeEach(async ({ page }) => {
  await installMasterDataMocks(page);
  await setAuthenticatedSession(page);
});

test('completes item fields and supports edit and deactivation', async ({ page }) => {
  await page.goto('/items');
  await expect(page.getByText('Avg. standard cost')).toBeVisible();
  await page.locator('button[title="Edit item"]:visible').first().click();
  await expect(page.getByRole('heading', { name: 'Edit Servo Drive' })).toBeVisible();
  await page.getByRole('button', { name: 'Inventory & Tax' }).click();
  await expect(page.getByLabel('Tax rate (%)')).toHaveValue('18');
  await page.getByLabel('Manufacturer part number').fill('MPN-SD-100');
  await page.getByRole('button', { name: 'Sales & Purchase' }).click();
  await expect(page.getByLabel('Preferred supplier')).toHaveValue(supplier._id);
  await page.getByLabel('Lead time (days)').fill('28');
  await page.getByLabel('Sales description').fill('Servo drive for customer documents');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.locator('button[title="Edit item"]:visible').first().click();
  await page.getByRole('button', { name: 'Inventory & Tax' }).click();
  await expect(page.getByLabel('Manufacturer part number')).toHaveValue('MPN-SD-100');
  await page.getByRole('button', { name: 'Sales & Purchase' }).click();
  await expect(page.getByLabel('Sales description')).toHaveValue('Servo drive for customer documents');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.locator('button[title="Deactivate item"]:visible').first().click();
  await expect(page.locator('span.badge-gray:visible').filter({ hasText: /^Inactive$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Active items0$/ }).first()).toBeVisible();
});

test('validates and creates a new item through the tabbed form', async ({ page }) => {
  await page.goto('/items');
  await page.getByRole('button', { name: 'New Item' }).click();
  await expect(page.getByRole('heading', { name: 'Create item' })).toBeVisible();
  await expect(page.getByTestId('modal-backdrop')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.elementFromPoint(window.innerWidth - 8, 30)?.getAttribute('data-testid'))).toBe('modal-backdrop');

  await page.getByRole('button', { name: 'Create item' }).click();
  await expect(page.getByText('Item name is required.')).toBeVisible();
  await page.getByLabel('Item name').fill('Safety relay');
  await page.getByLabel(/Item code \/ SKU/).fill('REL-SAFE-01');
  await page.locator('label').filter({ hasText: /^Category/ }).locator('select').selectOption(category._id);
  await page.locator('label').filter({ hasText: /^Base unit/ }).locator('select').selectOption(uom._id);

  await page.getByRole('button', { name: 'Sales & Purchase' }).click();
  await page.getByLabel('Selling price').fill('850');
  await page.getByLabel('Purchase cost').fill('600');
  await page.getByRole('button', { name: 'Create item' }).click();

  await expect(page.locator('p:visible').filter({ hasText: /^Safety relay$/ })).toBeVisible();
  await expect(page.locator('p:visible').filter({ hasText: /^REL-SAFE-01$/ })).toBeVisible();
});

test('persists full supplier details and supports edit and deactivation', async ({ page }) => {
  await page.goto('/suppliers');
  await page.locator('button[title="Edit supplier"]:visible').first().click();
  await expect(page.getByRole('heading', { name: 'Edit Precision Drives' })).toBeVisible();
  await page.getByRole('button', { name: 'Contact & Address' }).click();
  await expect(page.getByLabel('Phone')).toHaveValue('+91 90000 00000');
  await expect(page.getByLabel('Address', { exact: true })).toHaveValue('Pune');
  await page.getByRole('button', { name: 'Banking' }).click();
  await expect(page.getByLabel('IFSC / SWIFT code')).toHaveValue('TEST0001');
  await page.getByRole('button', { name: 'Overview' }).click();
  await page.getByLabel('Default lead time').fill('30');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('30 days', { exact: true }).first()).toBeVisible();
  await page.locator('button[title="Deactivate supplier"]:visible').first().click();
  await expect(page.locator('span.badge-gray:visible').filter({ hasText: /^Inactive$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Active suppliers0$/ }).first()).toBeVisible();
});

test('guides supplier creation and restores a draft from every section', async ({ page }) => {
  await page.goto('/suppliers');
  await page.getByRole('button', { name: 'New Supplier' }).first().click();
  await expect(page.getByRole('textbox', { name: 'Supplier number' })).toHaveValue('Assigned automatically on creation');
  await expect(page.getByPlaceholder('Select or enter a category')).toHaveAttribute('list', 'supplier-category-options');
  await page.getByPlaceholder('e.g. Precision Drives Pvt Ltd').fill('Draft Controls Ltd');

  await page.getByRole('button', { name: 'Contact & Address' }).click();
  await page.getByLabel('Email', { exact: true }).fill('orders@draft-controls.example');
  await page.getByRole('button', { name: 'Commercial' }).click();
  await page.getByPlaceholder('Select or enter terms').fill('Net 45');
  await page.getByRole('button', { name: 'Banking' }).click();
  await page.getByLabel('Bank name').fill('Draft Industry Bank');
  await page.getByRole('button', { name: 'Save draft' }).click();

  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'New Supplier' }).first().click();
  await expect(page.getByText(/saved supplier draft was restored/i)).toBeVisible();
  await expect(page.getByLabel('Bank name')).toHaveValue('Draft Industry Bank');
  await page.getByRole('button', { name: 'Commercial' }).click();
  await expect(page.getByPlaceholder('Select or enter terms')).toHaveValue('Net 45');
  await page.getByRole('button', { name: 'Contact & Address' }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('orders@draft-controls.example');
  await page.getByRole('button', { name: 'Discard draft' }).click();
  await expect(page.getByPlaceholder('e.g. Precision Drives Pvt Ltd')).toHaveValue('');
});

test('guides and validates customer details and supports list editing', async ({ page }) => {
  await page.goto('/customers');
  await page.getByRole('button', { name: 'Edit Atlas Automation' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Atlas Automation' })).toBeVisible();

  const industry = page.getByPlaceholder('Select or enter an industry');
  await expect(industry).toHaveAttribute('list', 'customer-industry-options');
  await industry.fill('Packaging Machinery');

  await page.getByRole('button', { name: 'Contacts' }).click();
  const workPhone = page.getByPlaceholder('National number').first();
  await workPhone.fill('123');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Enter a valid international phone number.')).toBeVisible();
  await workPhone.fill('89 12345678');

  await page.getByRole('button', { name: 'Address' }).click();
  await expect(page.getByPlaceholder('Select a country')).toHaveValue('Germany');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByText('Packaging Machinery')).toBeVisible();
  await page.getByRole('button', { name: 'Edit Atlas Automation' }).click();
  await page.getByRole('button', { name: 'Contacts' }).click();
  await expect(page.getByPlaceholder('National number').first()).toHaveValue('8912345678');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Atlas Automation' })).not.toBeVisible();
});

test('saves and restores an incomplete customer draft across every section', async ({ page }) => {
  await page.goto('/customers');
  await page.getByRole('button', { name: 'New Customer' }).first().click();

  const saveDraft = page.getByRole('button', { name: 'Save draft' });
  await expect(saveDraft).toBeDisabled();
  await page.getByPlaceholder('e.g. Atlas Beverage Systems').fill('Draft Packaging');

  await page.getByRole('button', { name: 'Contacts' }).click();
  await page.getByPlaceholder('Who owns the relationship?').fill('Mira Shah');
  await page.getByRole('button', { name: 'Commercial' }).click();
  await page.getByPlaceholder('Net 30, 50% advance, milestone based…').fill('Net 45');
  await saveDraft.click();
  await expect(page.getByRole('button', { name: 'Draft saved' })).toBeDisabled();

  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'New Customer' }).first().click();
  await expect(page.getByText(/saved draft was restored/i)).toBeVisible();
  await expect(page.getByPlaceholder('Net 30, 50% advance, milestone based…')).toHaveValue('Net 45');

  await page.getByRole('button', { name: 'Overview' }).click();
  await expect(page.getByPlaceholder('e.g. Atlas Beverage Systems')).toHaveValue('Draft Packaging');
  await page.getByRole('button', { name: 'Contacts' }).click();
  await expect(page.getByPlaceholder('Who owns the relationship?')).toHaveValue('Mira Shah');

  await page.getByRole('button', { name: 'Discard draft' }).click();
  await expect(page.getByPlaceholder('e.g. Atlas Beverage Systems')).toHaveValue('');
});

test('creates one complete customer with a system-generated number', async ({ page }) => {
  await page.goto('/customers');
  await page.getByRole('button', { name: 'New Customer' }).first().click();

  const createButton = page.getByRole('button', { name: 'Create Customer' });
  await expect(page.getByRole('textbox', { name: 'Customer Number', exact: true })).toHaveValue('Assigned automatically on creation');
  await expect(createButton).toBeDisabled();
  await expect(page.getByText(/5 required items remaining/)).toBeVisible();

  await page.getByPlaceholder('e.g. Atlas Beverage Systems').fill('Nova Packaging Systems');
  await page.getByPlaceholder('Select or enter an industry').fill('Packaging');
  await page.getByRole('button', { name: 'Contacts' }).click();
  await page.getByPlaceholder('Who owns the relationship?').fill('Leena Rao');
  await page.getByPlaceholder('name@company.com').first().fill('leena@nova.example');
  await expect(createButton).toBeDisabled();

  await page.getByRole('button', { name: 'Address' }).click();
  await page.getByPlaceholder('Select a country').fill('India');
  await expect(createButton).toBeEnabled();
  await page.getByRole('button', { name: 'Create Customer' }).click();

  await expect(page.getByText('Nova Packaging Systems')).toBeVisible();
  await expect(page.getByText('CUS-00002')).toBeVisible();
});
