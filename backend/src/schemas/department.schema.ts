import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { Document } from '../database/postgres-document.types';

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ trim: true })
  code: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
