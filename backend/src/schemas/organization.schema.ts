import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';

@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  website: string;

  @Prop({ trim: true })
  industry: string;

  @Prop({ trim: true })
  taxRegistrationNumber: string;

  @Prop({ trim: true })
  registrationNumber: string;

  @Prop({ trim: true, default: 'INR' })
  baseCurrency: string;

  @Prop({ trim: true, default: 'Asia/Kolkata' })
  timezone: string;

  @Prop({ trim: true, default: 'april' })
  fiscalYearStartMonth: string;

  @Prop({ trim: true, default: 'dd/MM/yyyy' })
  dateFormat: string;

  @Prop({ trim: true, default: 'en' })
  languageCode: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  stateProvince: string;

  @Prop({ trim: true })
  postalCode: string;

  @Prop({ trim: true, default: 'India' })
  country: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

@Schema({ timestamps: true })
export class Branch extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: DatabaseId, ref: 'Company', required: true })
  companyId: DatabaseId;

  @Prop({ trim: true })
  taxRegistrationNumber: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  stateProvince: string;

  @Prop({ trim: true })
  postalCode: string;

  @Prop({ trim: true, default: 'India' })
  country: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
BranchSchema.index({ companyId: 1, name: 1 });

export enum LocationType {
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  FACTORY = 'factory',
  SERVICE = 'service',
}

@Schema({ timestamps: true })
export class Location extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: DatabaseId, ref: 'Branch', required: true })
  branchId: DatabaseId;

  @Prop({ enum: LocationType, default: LocationType.OFFICE })
  type: LocationType;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  stateProvince: string;

  @Prop({ trim: true })
  postalCode: string;

  @Prop({ trim: true, default: 'India' })
  country: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
LocationSchema.index({ branchId: 1, type: 1 });
