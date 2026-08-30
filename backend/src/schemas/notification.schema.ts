import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { NotificationType } from '../common/enums';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: DatabaseId, ref: 'User', required: true })
  userId: DatabaseId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: DatabaseId, ref: 'Project' })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Task' })
  taskId: DatabaseId;

  @Prop({ default: false })
  read: boolean;

  @Prop({ trim: true })
  link: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

@Schema({ timestamps: true })
export class Risk extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ trim: true })
  impact: string;

  @Prop({ trim: true })
  likelihood: string;

  @Prop({ trim: true })
  mitigation: string;

  @Prop({ type: DatabaseId, ref: 'User' })
  ownerId: DatabaseId;

  @Prop({ default: false })
  resolved: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const RiskSchema = SchemaFactory.createForClass(Risk);
RiskSchema.index({ projectId: 1 });
