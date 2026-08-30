import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { ProcurementStatus } from '../common/enums';

@Schema({ timestamps: true })
export class ProcurementItem extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Deliverable' })
  deliverableId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Supplier' })
  supplierId: DatabaseId;

  @Prop({ enum: ProcurementStatus, default: ProcurementStatus.PENDING_DESIGN_RELEASE })
  status: ProcurementStatus;

  @Prop({ default: false })
  isLongLead: boolean;

  @Prop({ type: Number })
  estimatedLeadTimeDays: number;

  @Prop({ type: Date })
  orderDate: Date;

  @Prop({ type: Date })
  expectedDeliveryDate: Date;

  @Prop({ trim: true })
  notes: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ProcurementItemSchema = SchemaFactory.createForClass(ProcurementItem);
ProcurementItemSchema.index({ projectId: 1, status: 1 });

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  contactPerson: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  category: string;

  @Prop({ trim: true })
  paymentTerms: string;

  @Prop({ trim: true })
  taxRegistrationNumber: string;

  @Prop({ trim: true, uppercase: true, default: 'INR' })
  currencyCode: string;

  @Prop({ type: Object, default: {} })
  bankDetails: Record<string, string>;

  @Prop({ enum: ['pending', 'qualified', 'suspended'], default: 'pending' })
  qualificationStatus: string;

  @Prop({ type: Number, default: 0, min: 0 })
  defaultLeadTimeDays: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
SupplierSchema.index({ code: 1 }, { unique: true, sparse: true });
SupplierSchema.index({ name: 1 });

