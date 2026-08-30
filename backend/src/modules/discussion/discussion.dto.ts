import {
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { DiscussionEntryType } from '../../common/enums';

export class CreateDiscussionEntryDto {
  @IsEnum(DiscussionEntryType)
  type: DiscussionEntryType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[]; // User UUID strings

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalParticipants?: string[];

  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  isOpenQuestion?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateDiscussionEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  isOpenQuestion?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;

  @IsOptional()
  @IsString()
  resolvedBy?: string; // User UUID string
}
