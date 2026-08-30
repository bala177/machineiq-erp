export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export type QuoteLineItem = {
  itemName?: string;
  sku?: string;
  hsnSac?: string;
  description: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  discountPercent: number;
  taxName?: string;
  taxPercent: number;
  taxableAmount?: number;
  marginAmount?: number;
  marginPercent?: number;
  lineTotal?: number;
};

export type QuoteCustomerSnapshot = {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
  taxTreatment?: string;
  taxRegistrationNumber?: string;
  billingAddress?: QuoteAddress;
  shippingAddress?: QuoteAddress;
};

export type QuoteAddress = {
  address?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
};

export type QuoteRecord = {
  _id: string;
  quoteNo: string;
  customerId: any;
  opportunityId?: any;
  status: QuoteStatus;
  subject?: string;
  salesPerson?: string;
  quoteDate: string;
  validUntil?: string;
  currency: string;
  customerSnapshot: QuoteCustomerSnapshot;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge?: number;
  adjustment?: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  organizationSnapshot?: CommercialPreferences;
  acceptedAt?: string;
  acceptedBy?: any;
  customerPoNumber?: string;
  convertedProjectId?: any;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
};

export type QuoteFormValues = {
  customerId: string;
  opportunityId: string;
  subject: string;
  salesPerson: string;
  quoteDate: string;
  validUntil: string;
  currency: string;
  lineItems: QuoteLineItem[];
  notes: string;
  terms: string;
  shippingCharge: number;
  adjustment: number;
};

export type CommercialTax = {
  name: string;
  rate: number;
};

export type CommercialItem = {
  name: string;
  sku?: string;
  hsnSac?: string;
  unit?: string;
  rate?: number;
  taxName?: string;
  taxPercent?: number;
  description?: string;
};

export type CommercialPreferences = {
  organizationName?: string;
  organizationEmail?: string;
  organizationPhone?: string;
  taxRegistrationNumber?: string;
  billingAddress?: string;
  quotePrefix?: string;
  quoteNumberPadding?: number;
  defaultCurrency?: string;
  defaultValidityDays?: number;
  defaultTaxName?: string;
  defaultTaxPercent?: number;
  defaultNotes?: string;
  defaultTerms?: string;
  bankDetails?: string;
  units?: string[];
  taxes?: CommercialTax[];
  items?: CommercialItem[];
};

export const emptyQuoteLineItem: QuoteLineItem = {
  itemName: '',
  sku: '',
  hsnSac: '',
  description: '',
  unit: 'Nos',
  quantity: 1,
  unitPrice: 0,
  costPrice: 0,
  discountType: 'percentage',
  discountValue: 0,
  discountPercent: 0,
  taxName: '',
  taxPercent: 0,
};

export function createEmptyQuoteForm(preferences: CommercialPreferences = {}): QuoteFormValues {
  const today = new Date().toISOString().slice(0, 10);
  const valid = new Date();
  valid.setDate(valid.getDate() + Number(preferences.defaultValidityDays || 30));
  return {
    customerId: '',
    opportunityId: '',
    subject: '',
    salesPerson: '',
    quoteDate: today,
    validUntil: valid.toISOString().slice(0, 10),
    currency: normalizeCurrencyCode(preferences.defaultCurrency),
    lineItems: [
      {
        ...emptyQuoteLineItem,
        taxName: preferences.defaultTaxName || '',
        taxPercent: Number(preferences.defaultTaxPercent || 0),
      },
    ],
    notes: preferences.defaultNotes || '',
    terms: preferences.defaultTerms || 'Payment as agreed. Quote validity is subject to technical confirmation.',
    shippingCharge: 0,
    adjustment: 0,
  };
}

export function quoteToForm(quote: QuoteRecord): QuoteFormValues {
  return {
    customerId: typeof quote.customerId === 'string' ? quote.customerId : quote.customerId?._id || '',
    opportunityId: typeof quote.opportunityId === 'string' ? quote.opportunityId : quote.opportunityId?._id || '',
    subject: quote.subject || '',
    salesPerson: quote.salesPerson || '',
    quoteDate: quote.quoteDate ? new Date(quote.quoteDate).toISOString().slice(0, 10) : '',
    validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().slice(0, 10) : '',
    currency: normalizeCurrencyCode(quote.currency),
    lineItems: quote.lineItems?.length ? quote.lineItems : [{ ...emptyQuoteLineItem }],
    notes: quote.notes || '',
    terms: quote.terms || '',
    shippingCharge: Number(quote.shippingCharge || 0),
    adjustment: Number(quote.adjustment || 0),
  };
}

export function buildQuotePayload(form: QuoteFormValues) {
  return {
    customerId: form.customerId,
    opportunityId: form.opportunityId || undefined,
    subject: form.subject.trim() || undefined,
    salesPerson: form.salesPerson.trim() || undefined,
    quoteDate: form.quoteDate || undefined,
    validUntil: form.validUntil || undefined,
    currency: normalizeCurrencyCode(form.currency),
    lineItems: form.lineItems
      .map((item) => ({
        description: item.description.trim(),
        itemName: item.itemName?.trim() || undefined,
        sku: item.sku?.trim() || undefined,
        hsnSac: item.hsnSac?.trim() || undefined,
        unit: item.unit?.trim() || undefined,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        costPrice: Number(item.costPrice || 0),
        discountType: item.discountType || 'percentage',
        discountValue: Number(item.discountValue ?? item.discountPercent ?? 0),
        discountPercent: Number(item.discountPercent || 0),
        taxName: item.taxName?.trim() || undefined,
        taxPercent: Number(item.taxPercent || 0),
      }))
      .filter((item) => item.description.length > 0),
    notes: form.notes.trim() || undefined,
    terms: form.terms.trim() || undefined,
    shippingCharge: Number(form.shippingCharge || 0),
    adjustment: Number(form.adjustment || 0),
  };
}

export function calculateQuoteTotals(items: QuoteLineItem[], quoteLevel: { shippingCharge?: number; adjustment?: number } = {}) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  const lineItems = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const discountValue = Number(item.discountValue ?? item.discountPercent ?? 0);
    const discountType = item.discountType || 'percentage';
    const taxPercent = Number(item.taxPercent || 0);
    const gross = quantity * unitPrice;
    const discount = discountType === 'amount' ? Math.min(discountValue, gross) : gross * (discountValue / 100);
    const taxable = gross - discount;
    const tax = taxable * (taxPercent / 100);
    const lineTotal = taxable + tax;
    subtotal += gross;
    discountTotal += discount;
    taxTotal += tax;
    return { ...item, lineTotal: roundMoney(lineTotal) };
  });
  return {
    lineItems,
    subtotal: roundMoney(subtotal),
    discountTotal: roundMoney(discountTotal),
    taxTotal: roundMoney(taxTotal),
    shippingCharge: roundMoney(Number(quoteLevel.shippingCharge || 0)),
    adjustment: roundMoney(Number(quoteLevel.adjustment || 0)),
    grandTotal: roundMoney(subtotal - discountTotal + taxTotal + Number(quoteLevel.shippingCharge || 0) + Number(quoteLevel.adjustment || 0)),
  };
}

export function formatMoney(value: number | undefined, currency = 'INR') {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: normalizedCurrency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function customerNameFromQuote(quote: Partial<QuoteRecord>) {
  return quote.customerSnapshot?.name || quote.customerId?.name || '—';
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeCurrencyCode(currency: unknown) {
  if (typeof currency !== 'string') return 'INR';
  const code = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return 'INR';
  return code;
}
