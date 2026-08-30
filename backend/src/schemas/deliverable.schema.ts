import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { TaskStatus, Priority, ProcurementStatus } from '../common/enums';

@Schema({ timestamps: true })
export class Deliverable extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Machine' })
  machineId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Module' })
  moduleId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Subassembly' })
  subassemblyId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User' })
  ownerId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Department' })
  departmentId: DatabaseId;

  @Prop({ enum: TaskStatus, default: TaskStatus.NOT_STARTED })
  status: TaskStatus;

  @Prop({ enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Prop({ enum: ProcurementStatus, default: ProcurementStatus.NOT_APPLICABLE })
  procurementStatus: ProcurementStatus;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ default: false })
  isProcurementRelated: boolean;

  @Prop({ default: false })
  isLongLead: boolean;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const DeliverableSchema = SchemaFactory.createForClass(Deliverable);
DeliverableSchema.index({ projectId: 1, status: 1 });
DeliverableSchema.index({ procurementStatus: 1 });
DeliverableSchema.index({ ownerId: 1 });
