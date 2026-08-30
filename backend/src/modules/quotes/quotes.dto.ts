import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuoteStatus } from '../../common/enums';

export class QuoteLineItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  itemName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  hsnSac?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsIn(['percentage', 'amount'])
  discountType?: 'percentage' | 'amount';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;
}

export class CreateQuoteDto {
  @IsString()
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId: string;

  @IsOptional()
  @IsUUID('4', { message: 'opportunityId must be a valid UUID' })
  opportunityId?: string;

  @IsOptional()
  @IsDateString()
  quoteDate?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  salesPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  lineItems: QuoteLineItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  terms?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingCharge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adjustment?: number;
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsUUID('4', { message: 'customerId must be a valid UUID' })
  customerId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'opportunityId must be a valid UUID' })
  opportunityId?: string;

  @IsOptional()
  @IsDateString()
  quoteDate?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  salesPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  lineItems?: QuoteLineItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  terms?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingCharge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adjustment?: number;
}

export class UpdateQuoteStatusDto {
  @IsEnum(QuoteStatus)
  status: QuoteStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerPoNumber?: string;
}

export class ConvertQuoteToProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsUUID('4', { message: 'projectManagerId must be a valid UUID' })
  projectManagerId: string;

  @IsOptional()
  @IsDateString()
  targetDeliveryDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
