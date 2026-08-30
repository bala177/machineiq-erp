import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { NumberResetFrequency } from '../../schemas/document-type.schema';

const trim = (value: unknown) => typeof value === 'string' ? value.trim() : value;

export class CreateDocumentTypeDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value) @IsNotEmpty() @IsString() @Matches(/^[a-z][a-z0-9-]*$/) @MaxLength(50) code: string;
  @Transform(({ value }) => trim(value)) @IsNotEmpty() @IsString() @MaxLength(120) name: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value) @IsNotEmpty() @IsString() @Matches(/^[A-Z0-9-]+$/) @MaxLength(20) prefix: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(10) padding?: number;
  @IsOptional() @IsEnum(NumberResetFrequency) resetFrequency?: NumberResetFrequency;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) nextNumber?: number;
}

export class UpdateDocumentTypeDto {
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(120) name?: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value) @IsOptional() @IsString() @Matches(/^[A-Z0-9-]+$/) @MaxLength(20) prefix?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(10) padding?: number;
  @IsOptional() @IsEnum(NumberResetFrequency) resetFrequency?: NumberResetFrequency;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) nextNumber?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
