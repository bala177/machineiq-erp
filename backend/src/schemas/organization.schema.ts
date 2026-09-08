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

  @Prop({ trim: true, uppercase: true })
  cin: string;

  @Prop({ trim: true, uppercase: true })
  gstin: string;

  @Prop({ trim: true, uppercase: true })
  pan: string;

  @Prop({ trim: true, uppercase: true })
  tan: string;

  @Prop({ trim: true, uppercase: true })
  msmeNumber: string;

  @Prop({ type: Date })
  incorporatedOn: Date;

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

/**
 * Every attachment the statutory company profile can carry. Kinds prefixed
 * `director_`, plus `din_certificate` and `shareholding_certificate`, hang off
 * a director; the rest hang off the company itself.
 */
export enum CompanyDocumentKind {
  LOGO = 'logo',
  CIN_CERTIFICATE = 'cin_certificate',
  GST_CERTIFICATE = 'gst_certificate',
  PAN_CERTIFICATE = 'pan_certificate',
  TAN_CERTIFICATE = 'tan_certificate',
  MSME_CERTIFICATE = 'msme_certificate',
  MOA = 'moa',
  AOA = 'aoa',
  DIRECTOR_PHOTO = 'director_photo',
  DIN_CERTIFICATE = 'din_certificate',
  DIRECTOR_AADHAAR = 'director_aadhaar',
  DIRECTOR_PAN = 'director_pan',
  SHAREHOLDING_CERTIFICATE = 'shareholding_certificate',
}

export const DIRECTOR_DOCUMENT_KINDS: readonly CompanyDocumentKind[] = [
  CompanyDocumentKind.DIRECTOR_PHOTO,
  CompanyDocumentKind.DIN_CERTIFICATE,
  CompanyDocumentKind.DIRECTOR_AADHAAR,
  CompanyDocumentKind.DIRECTOR_PAN,
  CompanyDocumentKind.SHAREHOLDING_CERTIFICATE,
];

/** Kinds that must be a picture rather than a scanned certificate. */
export const IMAGE_ONLY_DOCUMENT_KINDS: readonly CompanyDocumentKind[] = [
  CompanyDocumentKind.LOGO,
  CompanyDocumentKind.DIRECTOR_PHOTO,
];

@Schema({ timestamps: true })
export class CompanyDirector extends Document {
  @Prop({ type: DatabaseId, ref: 'Company', required: true })
  companyId: DatabaseId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  designation: string;

  @Prop({ trim: true })
  din: string;

  @Prop({ trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ type: Number })
  shareholdingPercent: number;

  @Prop({ type: Date })
  appointedOn: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const CompanyDirectorSchema = SchemaFactory.createForClass(CompanyDirector);

@Schema({ timestamps: true })
export class CompanyDocument extends Document {
  @Prop({ type: DatabaseId, ref: 'Company', required: true })
  companyId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'CompanyDirector', default: null })
  directorId: DatabaseId | null;

  @Prop({ enum: CompanyDocumentKind, required: true })
  kind: CompanyDocumentKind;

  @Prop({ required: true, trim: true })
  fileName: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ type: Number, required: true })
  sizeBytes: number;

  /** Base64 data URL. Never returned by list queries. */
  @Prop({ required: true })
  content: string;

  @Prop({ type: Date })
  issuedOn: Date;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  uploadedBy: DatabaseId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const CompanyDocumentSchema = SchemaFactory.createForClass(CompanyDocument);

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
