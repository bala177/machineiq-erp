import { CountryCode, getCountries, isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';

export const ACCOUNT_TYPES = ['prospect', 'active', 'inactive', 'churned'] as const;
export type CustomerAccountType = (typeof ACCOUNT_TYPES)[number];

export const CUSTOMER_TYPES = ['business', 'individual'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1001+'] as const;
export type CustomerCompanySize = (typeof COMPANY_SIZES)[number] | '';

export const INDUSTRY_OPTIONS = [
  'Automotive', 'Consumer Goods', 'Electrical Equipment', 'Electronics', 'Food & Beverage',
  'Industrial Automation', 'Machinery Manufacturing', 'Medical Devices', 'Metal Fabrication',
  'Packaging', 'Pharmaceuticals', 'Plastics & Rubber', 'Process Industries', 'Renewable Energy',
  'Robotics', 'Semiconductors', 'Textiles', 'Warehousing & Logistics',
] as const;

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const COUNTRY_OPTIONS = getCountries()
  .map((code) => ({ code, name: regionNames.of(code) || code }))
  .sort((left, right) => left.name.localeCompare(right.name));

export function countryCodeForName(name: string): CountryCode | undefined {
  return COUNTRY_OPTIONS.find((country) => country.name.toLowerCase() === name.trim().toLowerCase())?.code;
}

export const ACCOUNT_TYPE_LABELS: Record<CustomerAccountType, string> = {
  prospect: 'Prospect',
  active: 'Active',
  inactive: 'Inactive',
  churned: 'Churned',
};

export const ACCOUNT_TYPE_COLORS: Record<CustomerAccountType, string> = {
  prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  inactive: 'bg-surface-tertiary text-fg-muted',
  churned: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export type CustomerFormValues = {
  name: string;
  accountType: CustomerAccountType;
  customerType: CustomerType;
  displayName: string;
  companySize: CustomerCompanySize;
  industry: string;
  website: string;
  // Primary contact
  contactPerson: string;
  email: string;
  phone: string;
  mobile: string;
  designation: string;
  department: string;
  // Secondary contact
  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;
  // Address
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  shippingAddress: string;
  shippingCity: string;
  shippingStateProvince: string;
  shippingPostalCode: string;
  shippingCountry: string;
  // Commercial
  vatNumber: string;
  taxTreatment: string;
  placeOfSupply: string;
  registrationNumber: string;
  paymentTerms: string;
  currencyCode: string;
  creditLimit: string;
  priceList: string;
  deliveryTerms: string;
  notes: string;
};

export type CustomerRecord = CustomerFormValues & {
  _id: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerFieldErrors = Partial<Record<keyof CustomerFormValues, string>>;

export const emptyCustomerForm: CustomerFormValues = {
  name: '',
  accountType: 'prospect',
  customerType: 'business',
  displayName: '',
  companySize: '',
  industry: '',
  website: '',
  contactPerson: '',
  email: '',
  phone: '',
  mobile: '',
  designation: '',
  department: '',
  secondaryContactName: '',
  secondaryContactEmail: '',
  secondaryContactPhone: '',
  address: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
  shippingAddress: '',
  shippingCity: '',
  shippingStateProvince: '',
  shippingPostalCode: '',
  shippingCountry: '',
  vatNumber: '',
  taxTreatment: '',
  placeOfSupply: '',
  registrationNumber: '',
  paymentTerms: '',
  currencyCode: 'INR',
  creditLimit: '',
  priceList: '',
  deliveryTerms: '',
  notes: '',
};

function normalizeWebsite(value: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function normalizePhone(value: string, countryName: string) {
  if (!value.trim()) return '';
  return parsePhoneNumberFromString(value, countryCodeForName(countryName))?.number || value.trim();
}

export function normalizeCustomerFormValues(values?: Partial<CustomerFormValues>): CustomerFormValues {
  const normalized = {
    ...emptyCustomerForm,
    ...values,
  } as CustomerFormValues;

  for (const field of Object.keys(emptyCustomerForm) as (keyof CustomerFormValues)[]) {
    if (normalized[field] === undefined || normalized[field] === null) {
      (normalized as Record<keyof CustomerFormValues, string>)[field] = emptyCustomerForm[field];
    }
  }

  normalized.creditLimit = String(normalized.creditLimit);
  normalized.currencyCode = normalized.currencyCode || 'INR';
  return normalized;
}

export function prepareCustomerPayload(values: CustomerFormValues): Partial<CustomerFormValues> {
  const result: Partial<CustomerFormValues> = {};

  for (const [key, value] of Object.entries(values)) {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (trimmed !== '' && trimmed !== undefined) {
      (result as any)[key] = trimmed;
    }
  }

  if (result.website) {
    result.website = normalizeWebsite(result.website);
  }
  if (result.currencyCode) {
    result.currencyCode = result.currencyCode.toUpperCase();
  }
  for (const field of ['email', 'secondaryContactEmail'] as const) {
    if (result[field]) result[field] = result[field]!.toLowerCase();
  }
  for (const field of ['phone', 'mobile', 'secondaryContactPhone'] as const) {
    if (result[field]) result[field] = normalizePhone(result[field]!, result.country || values.country);
  }
  if (result.creditLimit) {
    (result as any).creditLimit = Number(result.creditLimit);
  }

  return result;
}

export function validateCustomerForm(
  values: CustomerFormValues,
  { requireComplete = true }: { requireComplete?: boolean } = {},
): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const mobile = values.mobile.trim();
  const secondaryEmail = values.secondaryContactEmail.trim();

  if (!name) {
    errors.name = 'Customer name is required.';
  } else if (name.length < 2) {
    errors.name = 'Customer name should be at least 2 characters.';
  }

  if (requireComplete && !values.contactPerson.trim()) {
    errors.contactPerson = 'Add a primary contact name.';
  }

  if (requireComplete && !values.industry.trim()) {
    errors.industry = 'Industry helps sales and project teams.';
  }

  if (requireComplete && !values.country.trim()) {
    errors.country = 'Country is required.';
  }

  if (requireComplete && !email && !phone && !mobile) {
    errors.email = 'Provide at least one contact method.';
    errors.phone = 'Provide at least one contact method.';
    errors.mobile = 'Provide at least one contact method.';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (phone && !isValidPhoneNumber(phone, countryCodeForName(values.country))) {
    errors.phone = 'Enter a valid international phone number.';
  }

  if (mobile && !isValidPhoneNumber(mobile, countryCodeForName(values.country))) {
    errors.mobile = 'Enter a valid international mobile number.';
  }

  if (values.creditLimit.trim() && Number(values.creditLimit) < 0) {
    errors.creditLimit = 'Credit limit cannot be negative.';
  }

  if (secondaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryEmail)) {
    errors.secondaryContactEmail = 'Enter a valid email address.';
  }

  if (values.secondaryContactPhone.trim() && !isValidPhoneNumber(values.secondaryContactPhone, countryCodeForName(values.country))) {
    errors.secondaryContactPhone = 'Enter a valid international phone number.';
  }

  if (values.website.trim()) {
    try {
      const url = new URL(normalizeWebsite(values.website.trim()));
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.website = 'Website must start with http:// or https://.';
      }
    } catch {
      errors.website = 'Enter a valid website URL.';
    }
  }

  if (values.notes.length > 2000) {
    errors.notes = 'Notes should stay under 2000 characters.';
  }

  return errors;
}

export function formatCustomerLocation(customer?: Partial<CustomerFormValues> | null) {
  if (!customer) return '—';
  const location = [customer.city, customer.stateProvince, customer.country].filter(Boolean).join(', ');
  return location || '—';
}

export function formatCustomerContact(customer?: Partial<CustomerFormValues> | null) {
  if (!customer) return '—';
  return customer.contactPerson || customer.email || customer.phone || '—';
}

export function formatCustomerSelectLabel(customer: Partial<CustomerRecord>) {
  const parts = [customer.name, customer.contactPerson, customer.country].filter(Boolean);
  return parts.join(' • ');
}
