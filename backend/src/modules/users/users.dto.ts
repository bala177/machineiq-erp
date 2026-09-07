import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { Role } from '../../common/enums';
import { IsOptionalUuid } from '../../common/optional-uuid';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptionalUuid('departmentId must be a valid department id')
  departmentId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // password and email are intentionally excluded — handled via dedicated endpoints
}
