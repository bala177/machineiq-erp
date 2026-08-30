import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { TaskStatus, Priority, TaskType } from '../common/enums';

@Schema({ timestamps: true })
export class Task extends Document {
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

  @Prop({ enum: TaskType, default: TaskType.DESIGN })
  type: TaskType;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  completedDate: Date;

  @Prop({ type: [{ type: DatabaseId, ref: 'Task' }], default: [] })
  dependsOn: DatabaseId[];

  @Prop({ type: DatabaseId, ref: 'Task' })
  dependsOnTaskId: DatabaseId | null;

  @Prop({ default: false })
  dependencyBlocked: boolean;

  @Prop({ trim: true })
  blockerReason: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ ownerId: 1 });
TaskSchema.index({ departmentId: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ status: 1 });
