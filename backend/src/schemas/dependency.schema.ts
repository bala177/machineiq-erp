import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { DependencyType } from '../common/enums';

@Schema({ timestamps: true })
export class Dependency extends Document {
  @Prop({ type: DatabaseId, ref: 'Task', required: true })
  sourceTaskId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Task', required: true })
  targetTaskId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ enum: DependencyType, default: DependencyType.FINISH_TO_START })
  type: DependencyType;

  @Prop({ trim: true })
  notes: string;
}

export const DependencySchema = SchemaFactory.createForClass(Dependency);
DependencySchema.index({ sourceTaskId: 1 });
DependencySchema.index({ targetTaskId: 1 });
DependencySchema.index({ projectId: 1 });

@Schema({ timestamps: true })
export class Blocker extends Document {
  @Prop({ type: DatabaseId, ref: 'Task', required: true })
  taskId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: DatabaseId, ref: 'User' })
  reportedBy: DatabaseId;

  @Prop({ default: false })
  resolved: boolean;

  @Prop({ type: Date })
  resolvedAt: Date;

  @Prop({ trim: true })
  resolution: string;
}

export const BlockerSchema = SchemaFactory.createForClass(Blocker);
BlockerSchema.index({ taskId: 1 });
BlockerSchema.index({ projectId: 1, resolved: 1 });
