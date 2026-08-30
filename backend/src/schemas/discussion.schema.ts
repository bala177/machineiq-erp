import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { DiscussionEntryType } from '../common/enums';

@Schema({ timestamps: true })
export class DiscussionEntry extends Document {
  @Prop({ type: DatabaseId, ref: 'Opportunity', required: true })
  opportunityId: DatabaseId;

  @Prop({ required: true, enum: Object.values(DiscussionEntryType) })
  type: DiscussionEntryType;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  authorId: DatabaseId;

  @Prop({ type: [{ type: DatabaseId, ref: 'User' }], default: [] })
  participants: DatabaseId[];

  @Prop({ type: [String], default: [] })
  externalParticipants: string[];

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Boolean, default: false })
  isOpenQuestion: boolean;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ type: DatabaseId, ref: 'User', default: null })
  resolvedBy: DatabaseId | null;

  @Prop({ type: String, trim: true, default: null })
  resolution: string | null;

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const DiscussionEntrySchema = SchemaFactory.createForClass(DiscussionEntry);
DiscussionEntrySchema.index({ opportunityId: 1 });
DiscussionEntrySchema.index({ opportunityId: 1, isOpenQuestion: 1 });
