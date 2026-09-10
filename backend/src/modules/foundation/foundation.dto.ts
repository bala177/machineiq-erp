import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

const trimmed = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const code = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value;
const lowerCode = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;

export class WarehouseDto {
  @Transform(code) @IsString() @Matches(/^[A-Z0-9][A-Z0-9_-]{1,39}$/) code: string;
  @Transform(trimmed) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsUUID('4') locationId: string;
  @IsOptional() @IsUUID('4') managerId?: string | null;
  @Transform(trimmed) @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class EmployeeDto {
  @Transform(code) @IsString() @Matches(/^[A-Z0-9][A-Z0-9_-]{1,39}$/) employeeCode: string;
  @IsOptional() @IsUUID('4') userId?: string | null;
  @Transform(trimmed) @IsString() @IsNotEmpty() @MaxLength(120) firstName: string;
  @Transform(trimmed) @IsString() @IsNotEmpty() @MaxLength(120) lastName: string;
  @Transform(trimmed) @IsOptional() @IsEmail() @MaxLength(320) email?: string;
  @Transform(trimmed) @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @Transform(trimmed) @IsOptional() @IsString() @MaxLength(160) designation?: string;
  @IsOptional() @IsUUID('4') departmentId?: string | null;
  @IsOptional() @IsUUID('4') managerId?: string | null;
  @IsOptional() @IsDateString({ strict: true }) hireDate?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CurrencyDto {
  @Transform(code) @IsString() @Matches(/^[A-Z]{3}$/) code: string;
  @Transform(trimmed) @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @Transform(trimmed) @IsOptional() @IsString() @MaxLength(12) symbol?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(4) precision: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class TaxRateDto {
  @Transform(code) @IsString() @Matches(/^[A-Z0-9][A-Z0-9_-]{1,39}$/) code: string;
  @Transform(trimmed) @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Max(100) rate: number;
  @IsOptional() @IsDateString({ strict: true }) effectiveFrom?: string;
  @IsOptional() @IsDateString({ strict: true }) effectiveTo?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReferenceStatusDto {
  @Transform(lowerCode) @IsString() @Matches(/^[a-z][a-z0-9_-]{1,79}$/) module: string;
  @Transform(lowerCode) @IsString() @Matches(/^[a-z][a-z0-9_-]{1,39}$/) code: string;
  @Transform(trimmed) @IsString() @IsNotEmpty() @MaxLength(120) label: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) sortOrder: number;
  @IsOptional() @IsBoolean() isTerminal?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
