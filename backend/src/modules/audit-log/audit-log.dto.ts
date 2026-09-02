import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class AuditLogQueryDto {
  @IsOptional() @IsString() @MaxLength(120) entityType?: string;
  @IsOptional() @IsString() @MaxLength(80) action?: string;
  @IsOptional() @IsUUID('4') performedBy?: string;
  @IsOptional() @IsUUID('4') projectId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional() @IsIn(['ASC', 'DESC']) order: 'ASC' | 'DESC' = 'DESC';
}
