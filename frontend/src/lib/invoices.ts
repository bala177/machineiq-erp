import { QuoteCustomerSnapshot, QuoteLineItem, CommercialPreferences, formatMoney } from './quotes';

export const INVOICE_STATUSES = ['draft', 'sent', 'unpaid', 'partially_paid', 'paid', 'overdue', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceRecord = {
  _id: string;
  invoiceNo: string;
  customerId: any;
  sourceQuoteId: any;
  projectId?: any;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  customerSnapshot: QuoteCustomerSnapshot;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge?: number;
  adjustment?: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  terms?: string;
  organizationSnapshot?: CommercialPreferences;
  createdAt?: string;
};

export function invoiceCustomerName(invoice: Partial<InvoiceRecord>) {
  return invoice.customerSnapshot?.name || invoice.customerId?.name || '-';
}

export { formatMoney };
