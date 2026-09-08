import { OrganizationService } from './organization.service';

describe('OrganizationService company profile', () => {
  const company = { _id: 'company-id', toObject: () => ({ _id: 'company-id' }) };
  const companyModel = {
    findOne: jest.fn(),
    exists: jest.fn(),
    findByIdAndUpdate: jest.fn(async (_id: string, _update: any) => company),
    create: jest.fn(async (value) => ({ ...company, ...value })),
  };
  const audit = { log: jest.fn() };
  let service: OrganizationService;

  const profile = (overrides: Record<string, unknown> = {}) => ({
    code: 'MIQ', name: 'MachineIQ', baseCurrency: 'INR', timezone: 'Asia/Kolkata', ...overrides,
  }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    companyModel.findOne.mockResolvedValue(company);
    companyModel.exists.mockResolvedValue(null);
    service = new OrganizationService(companyModel as any, {} as any, {} as any, audit as any);
  });

  const submitted = () => companyModel.findByIdAndUpdate.mock.calls[0][1].$set as Record<string, unknown>;

  it('clears a statutory field the admin has emptied', async () => {
    await service.upsertCompany(profile({ cin: 'U29299KA2026PTC000001' }), 'user-id');
    const values = submitted();
    expect(values.cin).toBe('U29299KA2026PTC000001');
    // Absent optional fields are nulled so the stale value cannot survive.
    expect(values.gstin).toBeNull();
    expect(values.tan).toBeNull();
    expect(values.incorporatedOn).toBeNull();
  });

  it('never nulls the NOT NULL country column', async () => {
    await service.upsertCompany(profile(), 'user-id');
    expect(submitted()).not.toHaveProperty('country', null);
    expect(submitted().baseCurrency).toBe('INR');
  });
});
