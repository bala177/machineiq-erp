import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsUUID, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = (value: unknown) => typeof value === 'string' ? value.trim() : value;

export class CreatePermissionDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsNotEmpty() @IsString() @Matches(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/) @MaxLength(100)
  code: string;

  @Transform(({ value }) => trim(value)) @IsNotEmpty() @IsString() @MaxLength(80) module: string;
  @Transform(({ value }) => trim(value)) @IsNotEmpty() @IsString() @MaxLength(80) action: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(300) description?: string;
}

export class UpdatePermissionDto {
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(80) module?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(80) action?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class SetRolePermissionsDto {
  @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) permissionIds: string[];
}

export class CreateRoleDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString() @Matches(/^[a-z][a-z0-9_]{1,59}$/) key: string;
  @Transform(({ value }) => trim(value)) @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class UpdateRoleDto {
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @Transform(({ value }) => trim(value)) @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
