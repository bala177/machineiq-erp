import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { QuoteStatus } from '../common/enums';

@Schema({ _id: false })
export class QuoteAddressSnapshot {
  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  stateProvince: string;

  @Prop({ trim: true })
  postalCode: string;

  @Prop({ trim: true })
  country: string;
}

export const QuoteAddressSnapshotSchema = SchemaFactory.createForClass(QuoteAddressSnapshot);

@Schema({ _id: false })
export class QuoteCustomerSnapshot {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  contactPerson: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  paymentTerms: string;

  @Prop({ trim: true })
  taxTreatment: string;

  @Prop({ trim: true })
  taxRegistrationNumber: string;

  @Prop({ type: QuoteAddressSnapshotSchema, default: {} })
  billingAddress: QuoteAddressSnapshot;

  @Prop({ type: QuoteAddressSnapshotSchema, default: {} })
  shippingAddress: QuoteAddressSnapshot;
}

export const QuoteCustomerSnapshotSchema = SchemaFactory.createForClass(QuoteCustomerSnapshot);

@Schema({ _id: false })
export class QuoteLineItem {
  @Prop({ trim: true })
  itemName: string;

  @Prop({ trim: true })
  sku: string;

  @Prop({ trim: true })
  hsnSac: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ trim: true })
  unit: string;

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: Number, default: 0, min: 0 })
  costPrice: number;

  @Prop({ enum: ['percentage', 'amount'], default: 'percentage' })
  discountType: 'percentage' | 'amount';

  @Prop({ type: Number, default: 0, min: 0 })
  discountValue: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ trim: true })
  taxName: string;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  taxPercent: number;

  @Prop({ type: Number, default: 0, min: 0 })
  taxableAmount: number;

  @Prop({ type: Number, default: 0 })
  marginAmount: number;

  @Prop({ type: Number, default: 0 })
  marginPercent: number;

  @Prop({ type: Number, default: 0, min: 0 })
  lineTotal: number;
}

export const QuoteLineItemSchema = SchemaFactory.createForClass(QuoteLineItem);

@Schema({ timestamps: true })
export class Quote extends Document {
  @Prop({ required: true, trim: true, unique: true, index: true })
  quoteNo: string;

  @Prop({ type: DatabaseId, ref: 'Customer', required: true, index: true })
  customerId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Opportunity', default: null, index: true })
  opportunityId: DatabaseId | null;

  @Prop({ enum: QuoteStatus, default: QuoteStatus.DRAFT, index: true })
  status: QuoteStatus;

  @Prop({ trim: true })
  subject: string;

  @Prop({ trim: true })
  salesPerson: string;

  @Prop({ type: Date, required: true })
  quoteDate: Date;

  @Prop({ type: Date })
  validUntil: Date;

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
  adjustment: number;

  @Prop({ type: Number, default: 0 })
  shippingCharge: number;

  @Prop({ type: Number, default: 0 })
  grandTotal: number;

  @Prop({ trim: true })
  notes: string;

  @Prop({ trim: true })
  terms: string;

  @Prop({ type: Object, default: {} })
  organizationSnapshot: Record<string, any>;

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  @Prop({ type: DatabaseId, ref: 'User', default: null })
  acceptedBy: DatabaseId | null;

  @Prop({ trim: true })
  customerPoNumber: string;

  @Prop({ type: DatabaseId, ref: 'Project', default: null, index: true })
  convertedProjectId: DatabaseId | null;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  createdBy: DatabaseId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
QuoteSchema.index({ customerId: 1, status: 1 });
QuoteSchema.index({ opportunityId: 1, status: 1 });
QuoteSchema.index({ createdAt: -1 });
