import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { Document } from '../database/postgres-document.types';

@Schema({ timestamps: true })
export class Customer extends Document {
  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, enum: ['prospect', 'active', 'inactive', 'churned'], default: 'prospect' })
  accountType: string;

  @Prop({ trim: true, enum: ['business', 'individual'], default: 'business' })
  customerType: string;

  @Prop({ trim: true })
  displayName: string;

  @Prop({ trim: true, enum: ['1-10', '11-50', '51-200', '201-1000', '1001+', ''] })
  companySize: string;

  @Prop({ trim: true })
  industry: string;

  @Prop({ trim: true })
  website: string;

  // Primary contact
  @Prop({ trim: true })
  contactPerson: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  mobile: string;

  @Prop({ trim: true })
  designation: string;

  @Prop({ trim: true })
  department: string;

  // Secondary contact
  @Prop({ trim: true })
  secondaryContactName: string;

  @Prop({ trim: true })
  secondaryContactEmail: string;

  @Prop({ trim: true })
  secondaryContactPhone: string;

  // Address
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

  // Shipping address
  @Prop({ trim: true })
  shippingAddress: string;

  @Prop({ trim: true })
  shippingCity: string;

  @Prop({ trim: true })
  shippingStateProvince: string;

  @Prop({ trim: true })
  shippingPostalCode: string;

  @Prop({ trim: true })
  shippingCountry: string;

  // Commercial
  @Prop({ trim: true })
  vatNumber: string;

  @Prop({ trim: true })
  taxTreatment: string;

  @Prop({ trim: true })
  placeOfSupply: string;

  @Prop({ trim: true })
  registrationNumber: string;

  @Prop({ trim: true })
  paymentTerms: string;

  @Prop({ trim: true, default: 'INR' })
  currencyCode: string;

  @Prop({ type: Number, default: 0, min: 0 })
  creditLimit: number;

  @Prop({ trim: true })
  priceList: string;

  @Prop({ trim: true })
  deliveryTerms: string;

  @Prop({ trim: true })
  notes: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ code: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ name: 1 });
CustomerSchema.index({ accountType: 1 });
