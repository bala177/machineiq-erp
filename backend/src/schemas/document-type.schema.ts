import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { Document } from '../database/postgres-document.types';

export enum NumberResetFrequency {
  NEVER = 'never',
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
}

@Schema({ timestamps: true })
export class DocumentType extends Document {
  @Prop({ required: true, unique: true, trim: true, lowercase: true }) code: string;
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, trim: true, uppercase: true }) prefix: string;
  @Prop({ type: Number, default: 4, min: 1, max: 10 }) padding: number;
  @Prop({ enum: NumberResetFrequency, default: NumberResetFrequency.YEARLY }) resetFrequency: NumberResetFrequency;
  @Prop({ type: Number, default: 1, min: 1 }) nextNumber: number;
  @Prop({ trim: true, default: '' }) lastPeriod: string;
  @Prop({ default: true }) isActive: boolean;
  @Prop({ type: Date, default: null }) deletedAt: Date | null;
}

export const DocumentTypeSchema = SchemaFactory.createForClass(DocumentType);
