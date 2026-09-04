import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsUUID, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { LocationType } from '../../schemas/organization.schema';

const optionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};
const requiredString = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const code = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpdateCompanyDto {
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @Transform(code) @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @Transform(optionalString) @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @Transform(optionalString) @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(300) website?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(160) industry?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(80) taxRegistrationNumber?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
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
