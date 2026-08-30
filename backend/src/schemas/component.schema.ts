import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import {
  ComponentAssemblyStatus,
  ComponentDesignStatus,
  ComponentDiscipline,
  ComponentLifecycleStage,
  ComponentProcurementStatus,
  MachineNodeType,
  ModuleComponentCategory,
  ModuleComponentStatus,
} from '../common/enums';

@Schema({ timestamps: true })
export class Component extends Document {
  @Prop({ type: DatabaseId, ref: 'Item', default: null })
  itemId: DatabaseId | null;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  code: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  partName: string;

  @Prop({ type: Number, default: 1 })
  quantity: number;

  @Prop({ enum: ModuleComponentCategory })
  category: ModuleComponentCategory;

  @Prop({ trim: true })
  supplier: string;

  @Prop({ type: Number, min: 0, default: 0 })
  leadTimeWeeks: number;

  @Prop({ enum: ModuleComponentStatus, default: ModuleComponentStatus.PLANNED })
  status: ModuleComponentStatus;

  @Prop({ trim: true })
  remarks: string;

  @Prop({ default: false })
  longLeadRisk: boolean;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Machine', required: true })
  machineId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Unit' })
  moduleId: DatabaseId | null;

  @Prop({ type: DatabaseId, ref: 'Unit' })
  unitId: DatabaseId | null;

  @Prop({ type: DatabaseId, ref: 'EquipmentModule' })
  equipmentModuleId: DatabaseId | null;

  @Prop({ type: DatabaseId, ref: 'ControlModule' })
  controlModuleId: DatabaseId | null;

  @Prop({ enum: ComponentDiscipline })
  discipline: ComponentDiscipline;

  @Prop({ enum: [MachineNodeType.MACHINE, MachineNodeType.UNIT, MachineNodeType.EQUIPMENT_MODULE, MachineNodeType.CONTROL_MODULE], required: true })
  parentType: MachineNodeType;

  @Prop({ type: DatabaseId, required: true })
  parentId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User', required: true })
  ownerId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User' })
  reviewerId: DatabaseId;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ enum: ComponentDesignStatus, default: ComponentDesignStatus.NOT_STARTED })
  designStatus: ComponentDesignStatus;

  @Prop({ enum: ComponentProcurementStatus, default: ComponentProcurementStatus.NOT_READY })
  procurementStatus: ComponentProcurementStatus;

  @Prop({ enum: ComponentAssemblyStatus, default: ComponentAssemblyStatus.NOT_READY })
  assemblyStatus: ComponentAssemblyStatus;

  // Compatibility field while the rest of the product migrates off the legacy single-stage workflow.
  @Prop({ enum: ComponentLifecycleStage, default: ComponentLifecycleStage.DESIGN })
  lifecycleStage: ComponentLifecycleStage;

  @Prop({ type: [{ type: DatabaseId, ref: 'Component' }], default: [] })
  dependencyIds: DatabaseId[];

  @Prop({ type: [{ type: DatabaseId, ref: 'Deliverable' }], default: [] })
  deliverableIds: DatabaseId[];

  @Prop({ default: false })
  procurementVisible: boolean;

  @Prop({ default: false })
  procurementBlocked: boolean;

  @Prop({ default: false })
  assemblyBlocked: boolean;

  @Prop({ default: false })
  blockedByDependencies: boolean;

  @Prop({ type: [{ type: DatabaseId, ref: 'Component' }], default: [] })
  blockedByComponentIds: DatabaseId[];

  @Prop({ trim: true })
  blockerReason: string;

  @Prop({ type: DatabaseId, ref: 'User' })
  reviewApprovedBy: DatabaseId;

  @Prop({ type: Date })
  reviewApprovedAt: Date;

  @Prop({ type: Date })
  releasedAt: Date;

  @Prop({ type: Date })
  procurementReadyAt: Date;

  @Prop({ type: Date })
  orderedAt: Date;

  @Prop({ type: Date })
  receivedAt: Date;

  @Prop({ type: Date })
  assemblyReadyAt: Date;

  @Prop({ default: false })
  isDelayed: boolean;

  @Prop({ type: Date })
  delayedAt: Date;

  @Prop({ type: Date })
  reminderSentAt: Date;

  @Prop({ type: Date })
  overdueNotifiedAt: Date;

  @Prop({ type: Date })
  escalatedAt: Date;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ComponentSchema = SchemaFactory.createForClass(Component);
ComponentSchema.index({ projectId: 1, machineId: 1 });
ComponentSchema.index({ itemId: 1 });
ComponentSchema.index({ ownerId: 1, lifecycleStage: 1 });
ComponentSchema.index({ dueDate: 1 });
ComponentSchema.index({ lifecycleStage: 1, procurementVisible: 1 });
ComponentSchema.index({ machineId: 1, designStatus: 1 });
ComponentSchema.index({ machineId: 1, procurementStatus: 1 });
ComponentSchema.index({ machineId: 1, isDelayed: 1 });
ComponentSchema.index({ moduleId: 1, status: 1 });
ComponentSchema.index({ moduleId: 1, longLeadRisk: 1 });
