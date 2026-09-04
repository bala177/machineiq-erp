export const SUPPLIER_QUALIFICATION_STATUSES = ['pending', 'qualified', 'suspended'] as const;
export type SupplierQualificationStatus = (typeof SUPPLIER_QUALIFICATION_STATUSES)[number];

export const SUPPLIER_CATEGORIES = [
  'Automation & Controls',
  'Electrical & Electronics',
  'Fabrication & Machining',
  'Hydraulics & Pneumatics',
  'Logistics & Freight',
  'Mechanical Components',
  'Packaging Materials',
  'Raw Materials',
  'Safety Equipment',
  'Services & Contractors',
  'Software & Technology',
  'Tools & Consumables',
] as const;

export const PAYMENT_TERM_OPTIONS = [
  'Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90',
] as const;

export const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'JPY', 'SGD'] as const;

export type SupplierBankDetails = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscSwiftCode: string;
};

export type SupplierFormValues = {
  name: string;
  displayName: string;
  website: string;
  category: string;
  qualificationStatus: SupplierQualificationStatus;
  defaultLeadTimeDays: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile: string;
  designation: string;
  department: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  paymentTerms: string;
  taxRegistrationNumber: string;
  taxTreatment: string;
  placeOfSupply: string;
  currencyCode: string;
  bankDetails: SupplierBankDetails;
  notes: string;
};

export type SupplierRecord = Omit<SupplierFormValues, 'defaultLeadTimeDays'> & {
  _id: string;
  code: string;
  defaultLeadTimeDays: number;
  isActive: boolean;
};

export type SupplierPayload = Omit<SupplierFormValues, 'defaultLeadTimeDays'> & {
  defaultLeadTimeDays: number;
};

export type SupplierFieldErrors = Partial<Record<keyof SupplierFormValues | keyof SupplierBankDetails, string>>;

export const emptySupplierForm: SupplierFormValues = {
  name: '',
  displayName: '',
  website: '',
  category: '',
  qualificationStatus: 'pending',
  defaultLeadTimeDays: '0',
  contactPerson: '',
  email: '',
  phone: '',
  mobile: '',
  designation: '',
  department: '',
  address: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
  paymentTerms: '',
  taxRegistrationNumber: '',
  taxTreatment: '',
  placeOfSupply: '',
  currencyCode: 'INR',
  bankDetails: { accountName: '', accountNumber: '', bankName: '', ifscSwiftCode: '' },
  notes: '',
};

export function normalizeSupplierFormValues(values?: Partial<SupplierRecord | SupplierFormValues>): SupplierFormValues {
  const bankDetails = values?.bankDetails || emptySupplierForm.bankDetails;
  return {
    ...emptySupplierForm,
    ...values,
    name: values?.name || '',
    displayName: values?.displayName || '',
    website: values?.website || '',
    category: values?.category || '',
    qualificationStatus: values?.qualificationStatus || 'pending',
    defaultLeadTimeDays: String(values?.defaultLeadTimeDays ?? 0),
    contactPerson: values?.contactPerson || '',
    email: values?.email || '',
    phone: values?.phone || '',
    mobile: values?.mobile || '',
    designation: values?.designation || '',
    department: values?.department || '',
    address: values?.address || '',
    city: values?.city || '',
    stateProvince: values?.stateProvince || '',
    postalCode: values?.postalCode || '',
    country: values?.country || '',
    paymentTerms: values?.paymentTerms || '',
    taxRegistrationNumber: values?.taxRegistrationNumber || '',
    taxTreatment: values?.taxTreatment || '',
    placeOfSupply: values?.placeOfSupply || '',
    currencyCode: values?.currencyCode || 'INR',
    bankDetails: {
      accountName: bankDetails.accountName || '',
      accountNumber: bankDetails.accountNumber || '',
      bankName: bankDetails.bankName || '',
      ifscSwiftCode: bankDetails.ifscSwiftCode || '',
    },
    notes: values?.notes || '',
  };
}

export function validateSupplierForm(values: SupplierFormValues) {
  const errors: SupplierFieldErrors = {};
  if (!values.name.trim()) errors.name = 'Supplier name is required.';
  else if (values.name.trim().length < 2) errors.name = 'Supplier name should be at least 2 characters.';
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.defaultLeadTimeDays !== '' && (!Number.isInteger(Number(values.defaultLeadTimeDays)) || Number(values.defaultLeadTimeDays) < 0)) {
    errors.defaultLeadTimeDays = 'Lead time must be a whole number of days.';
  }
  if (!values.currencyCode.trim()) errors.currencyCode = 'Transaction currency is required.';
  if (values.website.trim()) {
    try { new URL(/^https?:\/\//i.test(values.website) ? values.website : `https://${values.website}`); }
    catch { errors.website = 'Enter a valid website address.'; }
  }
  if (values.notes.length > 2000) errors.notes = 'Notes should stay under 2000 characters.';
  return errors;
}

export function prepareSupplierPayload(values: SupplierFormValues) {
  return {
    name: values.name.trim(),
    displayName: values.displayName.trim(),
    website: values.website.trim() && !/^https?:\/\//i.test(values.website.trim()) ? `https://${values.website.trim()}` : values.website.trim(),
    category: values.category.trim(),
    qualificationStatus: values.qualificationStatus,
    defaultLeadTimeDays: Number(values.defaultLeadTimeDays || 0),
    contactPerson: values.contactPerson.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    mobile: values.mobile.trim(),
    designation: values.designation.trim(),
    department: values.department.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    stateProvince: values.stateProvince.trim(),
    postalCode: values.postalCode.trim(),
    country: values.country.trim(),
    paymentTerms: values.paymentTerms.trim(),
    taxRegistrationNumber: values.taxRegistrationNumber.trim(),
    taxTreatment: values.taxTreatment.trim(),
    placeOfSupply: values.placeOfSupply.trim(),
    currencyCode: values.currencyCode.trim().toUpperCase(),
    bankDetails: {
      accountName: values.bankDetails.accountName.trim(),
      accountNumber: values.bankDetails.accountNumber.trim(),
      bankName: values.bankDetails.bankName.trim(),
      ifscSwiftCode: values.bankDetails.ifscSwiftCode.trim().toUpperCase(),
    },
    notes: values.notes.trim(),
  };
}
