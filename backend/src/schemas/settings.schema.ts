import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { Document } from '../database/postgres-document.types';

@Schema({ timestamps: true })
export class SystemSetting extends Document {
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: any;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);
