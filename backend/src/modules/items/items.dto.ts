import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ItemType } from '../../schemas/item.schema';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const upper = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateItemCategoryDto {
  @Transform(upper) @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @IsOptional() @IsUUID('4') parentId?: string;
}

export class CreateUomDto {
  @Transform(upper) @IsString() @IsNotEmpty() @MaxLength(20) code: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(80) name: string;
  @IsOptional() @IsUUID('4') baseUomId?: string;
  @IsOptional() @IsNumber() @Min(0.000001) conversionFactor?: number;
}

export class UpdateItemCategoryDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @IsOptional() @IsUUID('4') parentId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateUomDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) name?: string;
  @IsOptional() @IsUUID('4') baseUomId?: string;
  @IsOptional() @IsNumber() @Min(0.000001) conversionFactor?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateItemDto {
  @Transform(upper) @IsString() @IsNotEmpty() @MaxLength(50) code: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) manufacturerPartNumber?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) barcode?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(2000) salesDescription?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(2000) purchaseDescription?: string;
  @IsOptional() @IsBoolean() salesEnabled?: boolean;
  @IsOptional() @IsBoolean() purchaseEnabled?: boolean;
  @IsUUID('4') categoryId: string;
  @IsUUID('4') uomId: string;
  @IsEnum(ItemType) itemType: ItemType;
  @IsOptional() @IsNumber() @Min(0) standardCost?: number;
  @IsOptional() @IsNumber() @Min(0) sellingPrice?: number;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(30) hsnSac?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxPercent?: number;
  @IsOptional() @IsBoolean() isStockItem?: boolean;
  @IsOptional() @IsNumber() @Min(0) reorderLevel?: number;
  @IsOptional() @IsUUID('4') defaultSupplierId?: string;
  @IsOptional() @IsNumber() @Min(0) leadTimeDays?: number;
}

export class UpdateItemDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) name?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) manufacturerPartNumber?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) barcode?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(2000) salesDescription?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(2000) purchaseDescription?: string;
  @IsOptional() @IsBoolean() salesEnabled?: boolean;
  @IsOptional() @IsBoolean() purchaseEnabled?: boolean;
  @IsOptional() @IsUUID('4') categoryId?: string;
  @IsOptional() @IsUUID('4') uomId?: string;
  @IsOptional() @IsEnum(ItemType) itemType?: ItemType;
  @IsOptional() @IsNumber() @Min(0) standardCost?: number;
  @IsOptional() @IsNumber() @Min(0) sellingPrice?: number;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(30) hsnSac?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxPercent?: number;
  @IsOptional() @IsBoolean() isStockItem?: boolean;
  @IsOptional() @IsNumber() @Min(0) reorderLevel?: number;
  @IsOptional() @IsUUID('4') defaultSupplierId?: string;
  @IsOptional() @IsNumber() @Min(0) leadTimeDays?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
