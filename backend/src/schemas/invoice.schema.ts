import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { InvoiceStatus } from '../common/enums';
import { QuoteCustomerSnapshotSchema, QuoteLineItemSchema, QuoteCustomerSnapshot, QuoteLineItem } from './quote.schema';

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ required: true, trim: true, unique: true, index: true })
  invoiceNo: string;

  @Prop({ type: DatabaseId, ref: 'Customer', required: true, index: true })
  customerId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Quote', required: true, index: true })
  sourceQuoteId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project', default: null, index: true })
  projectId: DatabaseId | null;

  @Prop({ enum: InvoiceStatus, default: InvoiceStatus.DRAFT, index: true })
  status: InvoiceStatus;

  @Prop({ type: Date, required: true })
  invoiceDate: Date;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ trim: true, default: 'INR' })
  currency: string;

  @Prop({ type: QuoteCustomerSnapshotSchema, required: true })
  customerSnapshot: QuoteCustomerSnapshot;

  @Prop({ type: [QuoteLineItemSchema], default: [] })
  lineItems: QuoteLineItem[];

  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  discountTotal: number;

  @Prop({ type: Number, default: 0 })
  taxTotal: number;

  @Prop({ type: Number, default: 0 })
  shippingCharge: number;

  @Prop({ type: Number, default: 0 })
  adjustment: number;

  @Prop({ type: Number, default: 0 })
  grandTotal: number;

  @Prop({ type: Number, default: 0 })
  amountPaid: number;

  @Prop({ type: Number, default: 0 })
  balanceDue: number;

  @Prop({ trim: true })
  notes: string;

  @Prop({ trim: true })
  terms: string;

  @Prop({ type: Object, default: {} })
  organizationSnapshot: Record<string, any>;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  createdBy: DatabaseId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ sourceQuoteId: 1, status: 1 });
InvoiceSchema.index({ customerId: 1, status: 1 });
InvoiceSchema.index({ projectId: 1, status: 1 });
InvoiceSchema.index({ createdAt: -1 });
