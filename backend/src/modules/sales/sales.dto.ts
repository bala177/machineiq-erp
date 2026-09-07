import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsDefined, IsIn, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class SalesLineDto {
  @IsOptional() @IsUUID() line_key?: string;
  @IsOptional() @IsUUID() item_id?: string;
  @IsOptional() @IsUUID() uom_id?: string;
  @IsString() @IsNotEmpty() @MaxLength(500) description: string;
  @IsString() @MaxLength(40) unit: string;
  @IsNumber({maxDecimalPlaces:6}) @Min(0.000001) @Max(999999999) quantity: number;
  @IsNumber({maxDecimalPlaces:6}) @Min(0) @Max(999999999) unit_price: number;
  @IsNumber({maxDecimalPlaces:6}) @Min(0) @Max(100) discount_percent: number;
  @IsNumber({maxDecimalPlaces:6}) @Min(0) @Max(100) tax_percent: number;
}
export class SalesMilestoneDto {
  @IsString() @IsNotEmpty() @MaxLength(200) label: string;
  @IsString() @MaxLength(200) trigger: string;
  @IsOptional() @IsDateString() due_date?: string;
  @IsNumber({maxDecimalPlaces:4}) @Min(0.0001) @Max(999999999999) amount: number;
}
export class RequirementsDto {
  @IsString() @MaxLength(4000) intended_use: string;
  @IsString() @MaxLength(4000) performance: string;
  @IsString() @MaxLength(4000) interfaces: string;
  @IsString() @MaxLength(4000) utilities: string;
  @IsString() @MaxLength(4000) constraints: string;
  @IsString() @MaxLength(4000) standards: string;
  @IsString() @MaxLength(4000) customer_items: string;
}
export class SalesDocumentDto {
  @IsIn(['enquiry','quote']) kind: 'enquiry'|'quote';
  @IsUUID() customer_id: string;
  @IsOptional() @IsUUID() site_id?: string;
  @IsOptional() @IsUUID() branch_id?: string;
  @IsUUID() owner_id: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsString() @MaxLength(120) machine_category: string;
  @IsNumber({maxDecimalPlaces:6}) @Min(0.000001) @Max(999999999) quantity: number;
  @IsDateString() document_date: string;
  @IsOptional() @IsDateString() valid_until?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() delivery_date?: string;
  @IsString() @MaxLength(3) currency: string;
  @IsString() @MaxLength(8000) scope: string;
  @IsString() @MaxLength(8000) exclusions: string;
  @IsString() @MaxLength(4000) warranty: string;
  @IsString() @MaxLength(8000) terms: string;
  @IsString() @MaxLength(200) customer_po: string;
  @IsString() @MaxLength(120) inquiry_source: string;
  @IsDefined() @ValidateNested() @Type(()=>RequirementsDto) requirements: RequirementsDto;
  @IsArray() @ArrayMaxSize(100) @ValidateNested({each:true}) @Type(()=>SalesLineDto) lines: SalesLineDto[];
  @IsArray() @ArrayMaxSize(40) @ValidateNested({each:true}) @Type(()=>SalesMilestoneDto) milestones: SalesMilestoneDto[];
  @IsOptional() @IsInt() @Min(1) version?: number;
}
export class SalesCommandDto {
  @IsIn(['qualify','lose','reopen','submit','approve','return','reject','customer_reject','send','accept','expire','revise','quote','order','project','hold','resume','cancel','activate']) action: string;
  @IsUUID() request_key: string;
  @IsInt() @Min(1) version: number;
  @IsOptional() @IsString() @MaxLength(4000) reason?: string;
  @IsOptional() @IsString() @MaxLength(4000) evidence?: string;
  @IsOptional() @IsString() @MaxLength(200) customer_po?: string;
  @IsOptional() @IsUUID() owner_id?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() delivery_date?: string;
}
export class SalesSiteDto {
  @IsUUID() customer_id: string;
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsString() @IsNotEmpty() @MaxLength(4000) address: string;
  @IsString() @MaxLength(300) contact: string;
}
export class SalesCommentDto {
  @IsIn(['comment','communication']) type: string;
  @IsString() @IsNotEmpty() @MaxLength(4000) text: string;
}
export class SalesQueryDto {
  @IsOptional() @IsIn(['enquiry','quote','order','project']) kind?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsString() @MaxLength(30) status?: string;
  @IsOptional() @IsUUID() customer_id?: string;
  @IsOptional() @IsUUID() owner_id?: string;
  @IsOptional() @IsUUID() branch_id?: string;
  @IsOptional() @IsUUID() department_id?: string;
  @IsOptional() @IsUUID() project_id?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(0) offset?: number;
}
export class SalesSettingsDto {
  @IsBoolean() separate_approver: boolean;
  @IsObject() currencies: Record<string,number>;
  @IsArray() @ArrayMaxSize(30) @IsNumber({}, {each:true}) @Min(0,{each:true}) @Max(100,{each:true}) taxes: number[];
  @IsObject() prefixes: Record<string,string>;
}
export class SalesAccessDto {
  @IsUUID() user_id: string;
  @IsIn(['own','all']) scope: string;
}
