import { randomUUID } from 'crypto';

/**
 * Runtime-compatible base for the legacy schema-shaped domain declarations.
 *
 * The domain classes still extend `Document`, so this must be a value as well
 * as a type. Keeping it deliberately empty lets TypeORM/migration code import
 * the declarations without pulling MongoDB into the released runtime.
 */
export class Document {
  [key: string]: any;
}

export class DatabaseId {
  private readonly value: string;

  constructor(value?: string | DatabaseId | { toString(): string }) {
    this.value = value ? value.toString() : randomUUID();
  }

  static isValid(value: unknown): boolean {
    if (value instanceof DatabaseId) return true;
    if (typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  toString(): string { return this.value; }
  toHexString(): string { return this.value; }
  valueOf(): string { return this.value; }
  toJSON(): string { return this.value; }
}

export namespace Types {
  export const ObjectId = DatabaseId;
  export type ObjectId = DatabaseId;
}

// The legacy schema classes remain useful as API-domain type declarations.
// These decorators are deliberately inert: PostgreSQL migrations own schema.
export const Prop = (_options?: unknown): PropertyDecorator => () => undefined;
export const Schema = (_options?: unknown): ClassDecorator => () => undefined;
export const SchemaFactory = {
  createForClass: <T>(_target: T): any => ({
    index: () => undefined,
  }),
};
