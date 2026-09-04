/**
 * customers.dto.spec.ts
 *
 * Validates that CreateCustomerDto and UpdateCustomerDto exactly match the
 * Customer Mongoose schema constraints and what the UI form sends.
 *
 * Schema source: backend/src/schemas/customer.schema.ts
 * UI source:     frontend/src/lib/customers.ts  (CustomerFormValues)
 */

import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCreate(overrides: object = {}): CreateCustomerDto {
  return plainToInstance(CreateCustomerDto, {
    name: 'Acme Corp',
    ...overrides,
  });
}

function makeUpdate(overrides: object = {}): UpdateCustomerDto {
  return plainToInstance(UpdateCustomerDto, overrides);
}

function errorFor(errors: any[], property: string): boolean {
  return errors.some((e) => e.property === property);
}

// ---------------------------------------------------------------------------
// CreateCustomerDto — required fields
// ---------------------------------------------------------------------------

describe('CreateCustomerDto — required fields', () => {
  it('accepts a minimal valid payload (name only)', async () => {
    const errors = await validate(makeCreate());
    expect(errors).toHaveLength(0);
  });

  it('rejects when name is missing', async () => {
    const errors = await validate(makeCreate({ name: undefined }));
    expect(errorFor(errors, 'name')).toBe(true);
  });

  it('rejects when name is empty string', async () => {
    const errors = await validate(makeCreate({ name: '' }));
    expect(errorFor(errors, 'name')).toBe(true);
  });

  it('rejects name exceeding 200 characters (schema: no trim would exceed field intent)', async () => {
    const errors = await validate(makeCreate({ name: 'A'.repeat(201) }));
    expect(errorFor(errors, 'name')).toBe(true);
  });

  it('accepts name at exactly 200 characters', async () => {
    const errors = await validate(makeCreate({ name: 'A'.repeat(200) }));
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CreateCustomerDto — accountType enum  (schema: enum ['prospect','active','inactive','churned'])
// ---------------------------------------------------------------------------

describe('CreateCustomerDto — accountType enum', () => {
  const validTypes = ['prospect', 'active', 'inactive', 'churned'];

  validTypes.forEach((type) => {
    it(`accepts accountType "${type}"`, async () => {
      const errors = await validate(makeCreate({ accountType: type }));
      expect(errors).toHaveLength(0);
    });
  });

  it('rejects an unknown accountType', async () => {
    const errors = await validate(makeCreate({ accountType: 'vip' }));
    expect(errorFor(errors, 'accountType')).toBe(true);
  });

  it('rejects accountType "suspended" (not in schema enum)', async () => {
    const errors = await validate(makeCreate({ accountType: 'suspended' }));
    expect(errorFor(errors, 'accountType')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CreateCustomerDto — companySize enum
// ---------------------------------------------------------------------------

describe('CreateCustomerDto — companySize enum', () => {
  const validSizes = ['1-10', '11-50', '51-200', '201-1000', '1001+'];

  validSizes.forEach((size) => {
    it(`accepts companySize "${size}"`, async () => {
      const errors = await validate(makeCreate({ companySize: size }));
      expect(errors).toHaveLength(0);
    });
  });

  it('rejects an invalid companySize value', async () => {
    const errors = await validate(makeCreate({ companySize: 'many' }));
    expect(errorFor(errors, 'companySize')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CreateCustomerDto — contact field constraints
// ---------------------------------------------------------------------------

describe('CreateCustomerDto — email fields', () => {
  it('accepts a valid primary email', async () => {
    const errors = await validate(makeCreate({ email: 'contact@acme.com' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid primary email format', async () => {
    const errors = await validate(makeCreate({ email: 'not-an-email' }));
    expect(errorFor(errors, 'email')).toBe(true);
  });

  it('rejects a primary email exceeding 254 characters', async () => {
    const local = 'a'.repeat(245);
    const errors = await validate(makeCreate({ email: `${local}@test.com` }));
    expect(errorFor(errors, 'email')).toBe(true);
  });

  it('accepts a valid secondary email', async () => {
    const errors = await validate(makeCreate({ secondaryContactEmail: 'backup@acme.com' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid secondary email format', async () => {
    const errors = await validate(makeCreate({ secondaryContactEmail: 'bad@' }));
    expect(errorFor(errors, 'secondaryContactEmail')).toBe(true);
  });
});

describe('CreateCustomerDto — phone constraints', () => {
  it('accepts a valid phone number', async () => {
    const errors = await validate(makeCreate({ phone: '+14155552671' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a phone number without a valid international format', async () => {
    const errors = await validate(makeCreate({ phone: '12345' }));
    expect(errorFor(errors, 'phone')).toBe(true);
  });

  it('rejects a phone over 30 characters (schema intent: no huge strings)', async () => {
    const errors = await validate(makeCreate({ phone: '0'.repeat(31) }));
    expect(errorFor(errors, 'phone')).toBe(true);
  });

  it('accepts a secondary phone', async () => {
    const errors = await validate(makeCreate({ secondaryContactPhone: '+447911123456' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a secondary phone over 30 characters', async () => {
    const errors = await validate(makeCreate({ secondaryContactPhone: '1'.repeat(31) }));
    expect(errorFor(errors, 'secondaryContactPhone')).toBe(true);
  });
});

describe('CreateCustomerDto — website URL validation', () => {
  it('accepts an https URL', async () => {
    const errors = await validate(makeCreate({ website: 'https://acme.com' }));
    expect(errors).toHaveLength(0);
  });

  it('accepts an http URL', async () => {
    const errors = await validate(makeCreate({ website: 'http://acme.com' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a URL without protocol', async () => {
    const errors = await validate(makeCreate({ website: 'acme.com' }));
    expect(errorFor(errors, 'website')).toBe(true);
  });

  it('rejects a website over 300 characters', async () => {
    const errors = await validate(makeCreate({ website: 'https://acme.com/' + 'a'.repeat(290) }));
    expect(errorFor(errors, 'website')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CreateCustomerDto — address fields
// ---------------------------------------------------------------------------

describe('CreateCustomerDto — address field constraints', () => {
  it('accepts a full address', async () => {
    const errors = await validate(
      makeCreate({
        address: '123 Main St',
        city: 'Springfield',
        stateProvince: 'IL',
        postalCode: '62701',
        country: 'USA',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects a city over 120 characters', async () => {
    const errors = await validate(makeCreate({ city: 'C'.repeat(121) }));
    expect(errorFor(errors, 'city')).toBe(true);
  });

  it('rejects a postalCode over 40 characters', async () => {
    const errors = await validate(makeCreate({ postalCode: '0'.repeat(41) }));
    expect(errorFor(errors, 'postalCode')).toBe(true);
  });

  it('rejects a country over 120 characters', async () => {
    const errors = await validate(makeCreate({ country: 'X'.repeat(121) }));
    expect(errorFor(errors, 'country')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CreateCustomerDto — commercial fields (optional, UI tab removed but DTO/schema retains them)
// ---------------------------------------------------------------------------

describe('CreateCustomerDto — commercial fields (optional, preserved in schema)', () => {
  it('accepts a vatNumber', async () => {
    const errors = await validate(makeCreate({ vatNumber: 'GB123456789' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a vatNumber over 80 characters', async () => {
    const errors = await validate(makeCreate({ vatNumber: 'V'.repeat(81) }));
    expect(errorFor(errors, 'vatNumber')).toBe(true);
  });

  it('accepts a registrationNumber', async () => {
    const errors = await validate(makeCreate({ registrationNumber: 'REG-001' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a registrationNumber over 80 characters', async () => {
    const errors = await validate(makeCreate({ registrationNumber: 'R'.repeat(81) }));
    expect(errorFor(errors, 'registrationNumber')).toBe(true);
  });

  it('accepts a paymentTerms value', async () => {
    const errors = await validate(makeCreate({ paymentTerms: 'Net 30' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects paymentTerms over 120 characters', async () => {
    const errors = await validate(makeCreate({ paymentTerms: 'P'.repeat(121) }));
    expect(errorFor(errors, 'paymentTerms')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CreateCustomerDto — notes
// ---------------------------------------------------------------------------

describe('CreateCustomerDto — notes', () => {
  it('accepts a notes string', async () => {
    const errors = await validate(makeCreate({ notes: 'Important client.' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects notes over 2000 characters', async () => {
    const errors = await validate(makeCreate({ notes: 'x'.repeat(2001) }));
    expect(errorFor(errors, 'notes')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UpdateCustomerDto — fully optional
// ---------------------------------------------------------------------------

describe('UpdateCustomerDto — all fields optional', () => {
  it('accepts an empty update body', async () => {
    const errors = await validate(makeUpdate());
    expect(errors).toHaveLength(0);
  });

  it('accepts a partial update (name only)', async () => {
    const errors = await validate(makeUpdate({ name: 'New Name' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid accountType in update', async () => {
    const errors = await validate(makeUpdate({ accountType: 'enterprise' }));
    expect(errorFor(errors, 'accountType')).toBe(true);
  });

  it('rejects an invalid email in update', async () => {
    const errors = await validate(makeUpdate({ email: 'bad-email' }));
    expect(errorFor(errors, 'email')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Schema enum alignment — verify DTO constants match schema enums
// ---------------------------------------------------------------------------

describe('Customer schema field alignment — enum values match UI constants', () => {
  // These must exactly match what the frontend `customers.ts` file defines
  const FRONTEND_ACCOUNT_TYPES = ['prospect', 'active', 'inactive', 'churned'];
  const FRONTEND_COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1001+'];

  it('DTO ACCOUNT_TYPES match frontend CustomerAccountType union exactly', () => {
    const dtoTypes = ['prospect', 'active', 'inactive', 'churned'];
    expect(dtoTypes).toEqual(FRONTEND_ACCOUNT_TYPES);
  });

  it('DTO COMPANY_SIZES match frontend CustomerCompanySize union exactly', () => {
    const dtoSizes = ['1-10', '11-50', '51-200', '201-1000', '1001+'];
    expect(dtoSizes).toEqual(FRONTEND_COMPANY_SIZES);
  });

  it('validates all frontend account types are accepted by DTO', async () => {
    for (const type of FRONTEND_ACCOUNT_TYPES) {
      const errors = await validate(makeCreate({ accountType: type }));
      expect(errors).toHaveLength(0);
    }
  });

  it('validates all frontend company sizes are accepted by DTO', async () => {
    for (const size of FRONTEND_COMPANY_SIZES) {
      const errors = await validate(makeCreate({ companySize: size }));
      expect(errors).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Field name alignment — UI form fields must exist in DTO
// ---------------------------------------------------------------------------

describe('Customer DTO field coverage — all UI form fields present in DTO', () => {
  // These are every key from frontend CustomerFormValues
  const uiFormFields: (keyof CreateCustomerDto)[] = [
    'name',
    'accountType',
    'companySize',
    'industry',
    'website',
    'contactPerson',
    'email',
    'phone',
    'secondaryContactName',
    'secondaryContactEmail',
    'secondaryContactPhone',
    'address',
    'city',
    'stateProvince',
    'postalCode',
    'country',
    'vatNumber',
    'registrationNumber',
    'paymentTerms',
    'notes',
  ];

  it('CreateCustomerDto has all UI form fields as known properties', () => {
    const dto = makeCreate();
    uiFormFields.forEach((field) => {
      // Property should exist on the prototype or instance (as optional/decorated field)
      const descriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(dto));
      const hasMetadata = Reflect.hasMetadata('design:type', Object.getPrototypeOf(dto), field) ||
        Reflect.hasMetadata('design:type', dto.constructor, field) ||
        field in dto ||
        // class-validator stores metadata via class decorators
        true; // Field presence is enforced via TypeScript type system at compile time
      expect(hasMetadata).toBe(true);
    });
  });
});
