import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { ProjectStage, ProjectHealth, Priority } from '../common/enums';

@Schema()
export class Milestone {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Date })
  targetDate: Date;

  @Prop({ type: Date })
  actualDate: Date;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ trim: true })
  notes: string;
}

export const MilestoneSchema = SchemaFactory.createForClass(Milestone);

@Schema()
export class KickoffRecord {
  @Prop({ type: Date })
  date: Date;

  @Prop({ type: [{ type: DatabaseId, ref: 'User' }], default: [] })
  attendees: DatabaseId[];

  @Prop({ type: [String], default: [] })
  agendaItems: string[];

  @Prop({ type: [String], default: [] })
  decisions: string[];

  @Prop({ type: [String], default: [] })
  actionItems: string[];

  @Prop({ type: [String], default: [] })
  risks: string[];

  @Prop({ trim: true })
  notes: string;
}

export const KickoffRecordSchema = SchemaFactory.createForClass(KickoffRecord);

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, unique: true, sparse: true, index: true })
  projectNo: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Opportunity' })
  opportunityId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Quote' })
  sourceQuoteId: DatabaseId;

  @Prop({ type: Object, default: null })
  commercialSnapshot: Record<string, any> | null;

  @Prop({ type: DatabaseId, ref: 'Customer', required: true })
  customerId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  projectManagerId: DatabaseId;

  @Prop({ enum: ProjectStage, default: ProjectStage.INQUIRY })
  stage: ProjectStage;

  @Prop({ enum: ProjectHealth, default: ProjectHealth.HEALTHY })
  health: ProjectHealth;

  @Prop({ enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Prop({ type: Date })
  targetDeliveryDate: Date;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: [MilestoneSchema], default: [] })
  milestones: Milestone[];

  @Prop({ type: KickoffRecordSchema })
  kickoff: KickoffRecord;

  @Prop({ type: [{ type: DatabaseId, ref: 'User' }], default: [] })
  teamMembers: DatabaseId[];

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ stage: 1 });
ProjectSchema.index({ health: 1 });
ProjectSchema.index({ projectManagerId: 1 });
ProjectSchema.index({ customerId: 1 });
ProjectSchema.index({ sourceQuoteId: 1 });
