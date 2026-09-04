import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, IsUrl, MaxLength, Min } from 'class-validator';

const ACCOUNT_TYPES = ['prospect', 'active', 'inactive', 'churned'] as const;
const CUSTOMER_TYPES = ['business', 'individual'] as const;
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1001+'] as const;

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function optionalTrimmedString(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export class CreateCustomerDto {
  @Transform(({ value }) => trimString(value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES)
  accountType?: string;

  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  customerType?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsIn(COMPANY_SIZES)
  companySize?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(300)
  website?: string;

  // Primary contact
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  phone?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  mobile?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  // Secondary contact
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  secondaryContactName?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  secondaryContactEmail?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  secondaryContactPhone?: string;

  // Address
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateProvince?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  postalCode?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  // Shipping address
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shippingAddress?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingCity?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingStateProvince?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  shippingPostalCode?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingCountry?: string;

  // Commercial
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  vatNumber?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxTreatment?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeOfSupply?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  registrationNumber?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentTerms?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currencyCode?: string;

  @Transform(({ value }) => value === '' || value === undefined || value === null ? undefined : Number(value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  priceList?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deliveryTerms?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateCustomerDto {
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES)
  accountType?: string;

  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  customerType?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsIn(COMPANY_SIZES)
  companySize?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(300)
  website?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  phone?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  mobile?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  secondaryContactName?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  secondaryContactEmail?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsPhoneNumber()
  @MaxLength(30)
  secondaryContactPhone?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateProvince?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  postalCode?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shippingAddress?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingCity?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingStateProvince?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  shippingPostalCode?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingCountry?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  vatNumber?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxTreatment?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeOfSupply?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  registrationNumber?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentTerms?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currencyCode?: string;

  @Transform(({ value }) => value === '' || value === undefined || value === null ? undefined : Number(value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  priceList?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deliveryTerms?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
