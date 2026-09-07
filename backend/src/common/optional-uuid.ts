import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Optional foreign-key field backed by a `uuid` column.
 *
 * HTML `<select>` elements submit the empty string for their "none" option, and
 * `@IsOptional()` only skips null/undefined — so a bare `@IsOptional() @IsString()`
 * lets `''` through to PostgreSQL, which rejects it with
 * `invalid input syntax for type uuid: ""` and surfaces as an opaque 500.
 *
 * Normalise the empty string to null before validation so "none" actually clears
 * the column — null rather than undefined, because TypeORM's `merge` skips
 * undefined and would silently keep the previous department on update. Anything
 * else that is not a UUID is rejected with a 400 rather than failing mid-insert.
 */
export function IsOptionalUuid(message?: string) {
  return applyDecorators(
    Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value)),
    IsOptional(),
    IsUUID(undefined, message ? { message } : undefined),
  );
}
