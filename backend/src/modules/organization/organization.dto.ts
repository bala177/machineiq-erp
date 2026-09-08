import { Transform } from 'class-transformer';
import {
  IsBoolean, IsEmail, IsEnum, IsIn, IsNumber, IsUUID, IsNotEmpty, IsOptional,
  IsString, IsUrl, Matches, Max, MaxLength, Min,
} from 'class-validator';
import { CompanyDocumentKind, LocationType } from '../../schemas/organization.schema';

const optionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};
const requiredString = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const code = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value;
const optionalCode = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().toUpperCase();
  return trimmed || undefined;
};
/** Accepts an ISO timestamp or a plain date and stores a calendar date. */
const optionalDate = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 10) : undefined;
};

// Statutory identifier formats issued in India. Each is validated only when a
// value is supplied, so a company outside India simply leaves the slot empty.
export const CIN_PATTERN = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;
export const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;
export const TAN_PATTERN = /^[A-Z]{4}\d{5}[A-Z]$/;
export const DIN_PATTERN = /^\d{8}$/;
export const UDYAM_PATTERN = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateCompanyDto {
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @Transform(code) @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @Transform(optionalString) @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @Transform(optionalString) @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(300) website?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(160) industry?: string;

  @Transform(optionalCode) @IsOptional() @Matches(CIN_PATTERN, { message: 'CIN must look like U29299KA2026PTC000001' }) cin?: string;
  @Transform(optionalCode) @IsOptional() @Matches(GSTIN_PATTERN, { message: 'GSTIN must look like 29AABCM1234F1Z5' }) gstin?: string;
  @Transform(optionalCode) @IsOptional() @Matches(PAN_PATTERN, { message: 'PAN must look like AABCM1234F' }) pan?: string;
  @Transform(optionalCode) @IsOptional() @Matches(TAN_PATTERN, { message: 'TAN must look like BLRM12345F' }) tan?: string;
  @Transform(optionalCode) @IsOptional() @Matches(UDYAM_PATTERN, { message: 'MSME number must look like UDYAM-KA-03-0001234' }) msmeNumber?: string;
  @Transform(optionalDate) @IsOptional() @Matches(DATE_PATTERN, { message: 'Incorporation date must be a calendar date' }) incorporatedOn?: string;

  @Transform(code) @IsString() @IsNotEmpty() @MaxLength(8) baseCurrency: string;
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(80) timezone: string;
  @IsOptional() @IsIn(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']) fiscalYearStartMonth?: string;
  @IsOptional() @IsIn(['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd MMM yyyy']) dateFormat?: string;
  @IsOptional() @IsIn(['en', 'de', 'fr', 'es', 'it', 'pt']) languageCode?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(300) address?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) city?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) stateProvince?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(40) postalCode?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) country?: string;
}

/**
 * Nullable company columns the profile form owns. Emptying one of these clears
 * the column; `country` and the regional settings are deliberately absent
 * because their columns are NOT NULL and carry a default.
 */
export const COMPANY_OPTIONAL_FIELDS = [
  'email', 'phone', 'website', 'industry', 'cin', 'gstin', 'pan', 'tan', 'msmeNumber',
  'incorporatedOn', 'address', 'city', 'stateProvince', 'postalCode',
] as const;

export class CreateDirectorDto {
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(160) designation?: string;
  @Transform(optionalCode) @IsOptional() @Matches(DIN_PATTERN, { message: 'DIN must be 8 digits' }) din?: string;
  @Transform(optionalString) @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) shareholdingPercent?: number;
  @Transform(optionalDate) @IsOptional() @Matches(DATE_PATTERN, { message: 'Appointment date must be a calendar date' }) appointedOn?: string;
}

export class UpdateDirectorDto extends CreateDirectorDto {
  @Transform(requiredString) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UploadCompanyDocumentDto {
  @IsEnum(CompanyDocumentKind) kind: CompanyDocumentKind;
  @IsOptional() @IsUUID('4') directorId?: string;
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(260) fileName: string;
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(100) mimeType: string;
  /** Base64 data URL of the file. Size and type are both derived and checked server-side. */
  @IsString() @IsNotEmpty() content: string;
  @Transform(optionalDate) @IsOptional() @Matches(DATE_PATTERN, { message: 'Issue date must be a calendar date' }) issuedOn?: string;
}

export class CreateBranchDto {
  @Transform(code) @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(160) name: string;
  @IsUUID('4') companyId: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(80) taxRegistrationNumber?: string;
  @Transform(optionalString) @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(300) address?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) city?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) stateProvince?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(40) postalCode?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) country?: string;
}

export class UpdateBranchDto {
  @Transform(requiredString) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(80) taxRegistrationNumber?: string;
  @Transform(optionalString) @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(300) address?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) city?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) stateProvince?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(40) postalCode?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) country?: string;
}

export class CreateLocationDto {
  @Transform(code) @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(160) name: string;
  @IsUUID('4') branchId: string;
  @IsEnum(LocationType) type: LocationType;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(300) address?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) city?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) stateProvince?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(40) postalCode?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) country?: string;
}

export class UpdateLocationDto {
  @Transform(requiredString) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsEnum(LocationType) type?: LocationType;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(300) address?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) city?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) stateProvince?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(40) postalCode?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(120) country?: string;
}
