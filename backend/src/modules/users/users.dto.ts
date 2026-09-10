import { IsString, IsOptional, IsBoolean, Matches, MaxLength } from 'class-validator';
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
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{1,59}$/)
  role?: string;

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
