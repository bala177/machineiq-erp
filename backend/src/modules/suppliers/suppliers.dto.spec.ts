import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSupplierDto } from './suppliers.dto';

describe('CreateSupplierDto', () => {
  it('normalizes currency and accepts all Release 1 commercial fields', async () => {
    const dto = plainToInstance(CreateSupplierDto, { name: 'Precision Drives', currencyCode: ' usd ', paymentTerms: 'Net 30', taxRegistrationNumber: 'GST-1', defaultLeadTimeDays: 14, qualificationStatus: 'qualified', bankDetails: { bankName: 'Industry Bank' } });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.currencyCode).toBe('USD');
  });

  it('rejects negative default lead time', async () => {
    const dto = plainToInstance(CreateSupplierDto, { name: 'Precision Drives', defaultLeadTimeDays: -1 });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects unsupported qualification states', async () => {
    const dto = plainToInstance(CreateSupplierDto, { name: 'Precision Drives', qualificationStatus: 'approved' });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('accepts structured contact, address, tax, and notes fields', async () => {
    const dto = plainToInstance(CreateSupplierDto, { name: 'Precision Drives', displayName: 'Precision', website: 'https://precision.example', mobile: '+919876543210', designation: 'Account Manager', department: 'Sales', city: 'Pune', stateProvince: 'Maharashtra', postalCode: '411001', country: 'India', taxTreatment: 'Registered business', placeOfSupply: 'Maharashtra', notes: 'ISO 9001 certified' });
    expect(await validate(dto)).toHaveLength(0);
  });
});
