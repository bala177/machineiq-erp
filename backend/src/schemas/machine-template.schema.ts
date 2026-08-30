import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';

@Schema({ _id: false })
export class TemplateChecklistItem {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ trim: true })
  hint: string;

  @Prop({ default: false })
  required: boolean;
}

export const TemplateChecklistItemSchema = SchemaFactory.createForClass(TemplateChecklistItem);

@Schema({ timestamps: true })
export class MachineTemplate extends Document {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ trim: true })
  category: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  version: string;

  // Defaults applied to a new opportunity created from this template.
  // Stored as a plain object — keys correspond to opportunity intake fields.
  @Prop({ type: Object, default: {} })
  defaults: Record<string, unknown>;

  @Prop({ type: [TemplateChecklistItemSchema], default: [] })
  checklist: TemplateChecklistItem[];

  @Prop({ type: Number, default: 0 })
  usageCount: number;

  @Prop({ type: DatabaseId, ref: 'User' })
  createdBy: DatabaseId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const MachineTemplateSchema = SchemaFactory.createForClass(MachineTemplate);
MachineTemplateSchema.index({ category: 1 });
