import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';

@Schema({ timestamps: true })
export class ProjectDocument extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Task' })
  taskId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Module' })
  moduleId: DatabaseId;

  @Prop({ required: true, trim: true })
  fileUrl: string;

  @Prop({ trim: true })
  fileType: string;

  @Prop({ type: Number })
  fileSize: number;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  uploadedBy: DatabaseId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ProjectDocumentSchema = SchemaFactory.createForClass(ProjectDocument);
ProjectDocumentSchema.index({ projectId: 1 });

@Schema({ timestamps: true })
export class DecisionLog extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  decision: string;

  @Prop({ trim: true })
  rationale: string;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  madeBy: DatabaseId;

  @Prop({ type: [{ type: DatabaseId, ref: 'User' }], default: [] })
  participants: DatabaseId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const DecisionLogSchema = SchemaFactory.createForClass(DecisionLog);
DecisionLogSchema.index({ projectId: 1 });

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  authorId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Task' })
  taskId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Deliverable' })
  deliverableId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Opportunity' })
  opportunityId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project' })
  projectId: DatabaseId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ taskId: 1 });
CommentSchema.index({ projectId: 1 });
