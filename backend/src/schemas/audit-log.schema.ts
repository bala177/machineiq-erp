import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ type: DatabaseId, required: true })
  entityId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  performedBy: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project' })
  projectId: DatabaseId;

  @Prop({ type: Object })
  previousValues: Record<string, any>;

  @Prop({ type: Object })
  newValues: Record<string, any>;

  @Prop({ trim: true })
  ipAddress: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ projectId: 1 });
AuditLogSchema.index({ createdAt: -1 });
