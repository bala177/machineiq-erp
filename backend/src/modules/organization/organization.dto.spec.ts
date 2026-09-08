import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LocationType } from '../../schemas/organization.schema';
import { CreateBranchDto, CreateDirectorDto, CreateLocationDto, UpdateCompanyDto, UploadCompanyDocumentDto } from './organization.dto';
import { CompanyDocumentKind } from '../../schemas/organization.schema';

describe('Organization DTOs', () => {
  it('normalizes branch codes', async () => {
    const dto = plainToInstance(CreateBranchDto, { code: ' blr-hq ', name: 'Head Office', companyId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.code).toBe('BLR-HQ');
  });

  it('rejects unknown location types', async () => {
    const dto = plainToInstance(CreateLocationDto, {
      code: 'LOC-01', name: 'Test location', branchId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', type: 'yard',
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'type')).toBe(true);
  });

  it('accepts supported warehouse locations', async () => {
    const dto = plainToInstance(CreateLocationDto, {
      code: 'WH-01', name: 'Main warehouse', branchId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', type: LocationType.WAREHOUSE,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts fiscal and regional organization settings', async () => {
    const dto = plainToInstance(UpdateCompanyDto, { code: 'MIQ', name: 'MachineIQ', baseCurrency: 'INR', timezone: 'Asia/Kolkata', industry: 'Machinery Manufacturing', fiscalYearStartMonth: 'april', dateFormat: 'dd/MM/yyyy', languageCode: 'en' });
    expect(await validate(dto)).toHaveLength(0);
  });

  const statutoryErrors = async (overrides: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateCompanyDto, { code: 'MIQ', name: 'MachineIQ', baseCurrency: 'INR', timezone: 'Asia/Kolkata', ...overrides });
    return { dto, errors: await validate(dto) };
  };

  it('accepts and upper-cases a full set of Indian statutory identifiers', async () => {
    const { dto, errors } = await statutoryErrors({
      cin: ' u29299ka2026ptc000001 ', gstin: '29aabcm1234f1z5', pan: 'aabcm1234f',
      tan: 'blrm12345f', msmeNumber: 'udyam-ka-03-0001234', incorporatedOn: '2013-12-18',
    });
    expect(errors).toHaveLength(0);
    expect(dto.cin).toBe('U29299KA2026PTC000001');
    expect(dto.gstin).toBe('29AABCM1234F1Z5');
    expect(dto.msmeNumber).toBe('UDYAM-KA-03-0001234');
  });

  it('leaves every statutory identifier optional', async () => {
    const { dto, errors } = await statutoryErrors({ cin: '', gstin: '  ', pan: '', incorporatedOn: '' });
    expect(errors).toHaveLength(0);
    expect(dto.cin).toBeUndefined();
    expect(dto.gstin).toBeUndefined();
  });

  it.each([
    ['cin', 'U29299KA2026PTC00001'],
    ['gstin', '29AABCM1234F1Z'],
    ['pan', 'AABC1234F'],
    ['tan', 'BLRM1234F'],
    ['msmeNumber', 'UAM-KA-03-0001234'],
  ])('rejects a malformed %s', async (field, value) => {
    const { errors } = await statutoryErrors({ [field]: value });
    expect(errors.some((error) => error.property === field)).toBe(true);
  });

  it('normalizes an ISO timestamp to a calendar incorporation date', async () => {
    const { dto, errors } = await statutoryErrors({ incorporatedOn: '2013-12-18T00:00:00.000Z' });
    expect(errors).toHaveLength(0);
    expect(dto.incorporatedOn).toBe('2013-12-18');
  });

  it('requires a director DIN to be eight digits', async () => {
    const bad = plainToInstance(CreateDirectorDto, { name: 'Ravi Menon', din: '1234567' });
    expect((await validate(bad)).some((error) => error.property === 'din')).toBe(true);
    const good = plainToInstance(CreateDirectorDto, { name: 'Ravi Menon', din: '02451188', shareholdingPercent: 60 });
    expect(await validate(good)).toHaveLength(0);
  });

  it('keeps director shareholding within nought and a hundred percent', async () => {
    const dto = plainToInstance(CreateDirectorDto, { name: 'Ravi Menon', shareholdingPercent: 140 });
    expect((await validate(dto)).some((error) => error.property === 'shareholdingPercent')).toBe(true);
  });

  it('rejects an unknown company document kind', async () => {
    const dto = plainToInstance(UploadCompanyDocumentDto, {
      kind: 'bank_statement', fileName: 'x.pdf', mimeType: 'application/pdf', content: 'data:application/pdf;base64,AAAA',
    });
    expect((await validate(dto)).some((error) => error.property === 'kind')).toBe(true);
  });

  it('accepts a director soft copy upload', async () => {
    const dto = plainToInstance(UploadCompanyDocumentDto, {
      kind: CompanyDocumentKind.DIRECTOR_AADHAAR, directorId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1',
      fileName: 'aadhaar.pdf', mimeType: 'application/pdf', content: 'data:application/pdf;base64,AAAA',
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});
