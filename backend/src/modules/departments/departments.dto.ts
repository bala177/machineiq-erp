import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const optionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};
const requiredString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const code = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class CreateDepartmentDto {
  @Transform(requiredString) @IsString() @IsNotEmpty() @MaxLength(160) name: string;
  @Transform(code) @IsOptional() @IsString() @MaxLength(40) code?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class UpdateDepartmentDto {
  @Transform(requiredString) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @Transform(code) @IsOptional() @IsString() @MaxLength(40) code?: string;
  @Transform(optionalString) @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
