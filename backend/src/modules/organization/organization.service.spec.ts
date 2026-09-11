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

describe('OrganizationService operating structure', () => {
  const company = { _id: '11111111-1111-4111-8111-111111111111', isActive: true, toObject: () => ({}) };
  const branch = { _id: '22222222-2222-4222-8222-222222222222', code: 'HQ', isActive: true, toObject: () => ({}) };
  const location = { _id: '33333333-3333-4333-8333-333333333333', code: 'PLANT', isActive: true, toObject: () => ({}) };
  const populatedBranch = { ...branch, companyId: company };
  const populatedLocation = { ...location, branchId: branch };
  const branchQuery = { populate: jest.fn(), exec: jest.fn() };
  const locationQuery = { populate: jest.fn(), exec: jest.fn() };
  const companyModel = { findOne: jest.fn() };
  const branchModel = { findOne: jest.fn(), exists: jest.fn(), create: jest.fn(), findById: jest.fn() };
  const locationModel = { findOne: jest.fn(), exists: jest.fn(), create: jest.fn(), findById: jest.fn() };
  const audit = { log: jest.fn() };
  let service: OrganizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    companyModel.findOne.mockResolvedValue(company);
    branchModel.findOne.mockResolvedValue(branch); branchModel.exists.mockResolvedValue(null); branchModel.create.mockResolvedValue(branch);
    locationModel.findOne.mockResolvedValue(location); locationModel.exists.mockResolvedValue(null); locationModel.create.mockResolvedValue(location);
    branchQuery.populate.mockReturnValue(branchQuery); branchQuery.exec.mockResolvedValue(populatedBranch); branchModel.findById.mockReturnValue(branchQuery);
    locationQuery.populate.mockReturnValue(locationQuery); locationQuery.exec.mockResolvedValue(populatedLocation); locationModel.findById.mockReturnValue(locationQuery);
    service = new OrganizationService(companyModel as any, branchModel as any, locationModel as any, audit as any);
  });

  it('returns a populated query result after creating a branch', async () => {
    const result = await service.createBranch({ code: 'HQ', name: 'Head office', companyId: company._id } as any, 'user-id');
    expect(branchModel.findById).toHaveBeenCalledWith(branch._id);
    expect(branchQuery.populate).toHaveBeenCalledWith('companyId', 'code name');
    expect(result).toBe(populatedBranch);
  });

  it('returns a populated query result after creating a location', async () => {
    const result = await service.createLocation({ code: 'PLANT', name: 'Main plant', branchId: branch._id, type: 'factory' } as any, 'user-id');
    expect(locationModel.findById).toHaveBeenCalledWith(location._id);
    expect(locationQuery.populate).toHaveBeenCalledWith('branchId', 'code name');
    expect(result).toBe(populatedLocation);
  });
});
