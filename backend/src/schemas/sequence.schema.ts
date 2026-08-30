import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { Document } from '../database/postgres-document.types';

@Schema({ timestamps: true })
export class Sequence extends Document {
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  value: number;
}

export const SequenceSchema = SchemaFactory.createForClass(Sequence);
