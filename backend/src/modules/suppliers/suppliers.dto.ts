import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, MaxLength, Min, ValidateNested } from 'class-validator';

const QUALIFICATION_STATUSES = ['pending', 'qualified', 'suspended'] as const;
const trim = (value: unknown) => typeof value === 'string' ? value.trim() : value;
const optionalTrim = (value: unknown) => typeof value === 'string' ? value.trim() || undefined : value;
const optionalUppercase = (value: unknown) => typeof value === 'string' ? value.trim().toUpperCase() || undefined : value;

export class BankDetailsDto {
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(160) accountName?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(80) accountNumber?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(160) bankName?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(40) ifscSwiftCode?: string;
}

export class CreateSupplierDto {
  @Transform(({ value }) => trim(value)) @IsNotEmpty() @IsString() @MaxLength(200) name: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(200) displayName?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) contactPerson?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(30) mobile?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) designation?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) department?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(300) website?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(300) address?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) city?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) stateProvince?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(40) postalCode?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) country?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) category?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) paymentTerms?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(80) taxRegistrationNumber?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) taxTreatment?: string;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(120) placeOfSupply?: string;
  @Transform(({ value }) => optionalUppercase(value)) @IsOptional() @IsString() @MaxLength(8) currencyCode?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => BankDetailsDto) bankDetails?: BankDetailsDto;
  @IsOptional() @IsIn(QUALIFICATION_STATUSES) qualificationStatus?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(0) defaultLeadTimeDays?: number;
  @Transform(({ value }) => optionalTrim(value)) @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateSupplierDto extends CreateSupplierDto {
  @IsOptional() name: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
