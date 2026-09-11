import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export const FEEDBACK_TYPES = ['broken', 'hard_to_use', 'suggestion', 'general', 'positive'] as const;
export const FEEDBACK_URGENCIES = ['blocking', 'important', 'minor'] as const;
export const FEEDBACK_STATUSES = ['new', 'reviewing', 'needs_info', 'planned', 'fixed', 'wont_fix', 'closed'] as const;

export class CreateFeedbackDto {
  @IsIn(FEEDBACK_TYPES) type: string;
  @IsIn(FEEDBACK_URGENCIES) urgency: string;
  @IsString() @MinLength(5) @MaxLength(5000) @Transform(({ value }) => value?.trim()) message: string;
  @IsBoolean() contactAllowed: boolean;
  @IsString() @MinLength(1) @MaxLength(500) pagePath: string;
  @IsOptional() @IsString() @MaxLength(200) pageTitle?: string;
  @IsOptional() @IsString() @MaxLength(40) appVersion?: string;
  @IsOptional() @IsString() @MaxLength(80) gitCommit?: string;
  @IsOptional() @IsString() @MaxLength(500) browser?: string;
  @IsOptional() @IsIn(['desktop', 'tablet', 'mobile']) deviceType?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20000) viewportWidth?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20000) viewportHeight?: number;
  @IsOptional() @IsString() @MaxLength(80) timezone?: string;
  @IsOptional() @IsObject() recentApiError?: Record<string, unknown>;
  @IsOptional() @IsString() screenshotDataUrl?: string;
}

export class UpdateFeedbackDto {
  @IsOptional() @IsIn(FEEDBACK_STATUSES) status?: string;
  @IsOptional() @IsString() @MaxLength(5000) customerResponse?: string;
  @IsOptional() @IsString() @MaxLength(10000) internalNotes?: string;
  @IsOptional() @IsUUID() assigneeId?: string | null;
  @IsOptional() @IsString() @MaxLength(80) targetRelease?: string;
  @IsOptional() @IsUUID() duplicateOfId?: string | null;
}

export class FeedbackQueryDto {
  @IsOptional() @IsIn(FEEDBACK_STATUSES) status?: string;
  @IsOptional() @IsIn(FEEDBACK_TYPES) type?: string;
  @IsOptional() @IsIn(FEEDBACK_URGENCIES) urgency?: string;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsString() @MaxLength(80) targetRelease?: string;
}
