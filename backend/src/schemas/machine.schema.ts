import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { ModuleCoordinationStatus, ModuleDepartment } from '../common/enums';

@Schema({ _id: false })
export class ModuleDeliverable {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ default: false })
  completed: boolean;
}

export const ModuleDeliverableSchema = SchemaFactory.createForClass(ModuleDeliverable);

@Schema({ timestamps: true, collection: 'machines' })
export class Machine extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User' })
  ownerId: DatabaseId;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const MachineSchema = SchemaFactory.createForClass(Machine);
MachineSchema.index({ projectId: 1 });

@Schema({ timestamps: true, collection: 'units' })
export class Unit extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Machine', required: true })
  machineId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User' })
  ownerId: DatabaseId;

  @Prop({ trim: true })
  ownerName: string;

  @Prop({ enum: ModuleDepartment })
  department: ModuleDepartment;

  @Prop({ type: Date })
  plannedStartDate: Date;

  @Prop({ type: Date })
  plannedEndDate: Date;

  @Prop({ enum: ModuleCoordinationStatus, default: ModuleCoordinationStatus.NOT_STARTED })
  status: ModuleCoordinationStatus;

  @Prop({ type: [ModuleDeliverableSchema], default: [] })
  deliverables: ModuleDeliverable[];

  @Prop({ default: false })
  releaseReady: boolean;

  @Prop({ default: false })
  componentsLocked: boolean;

  @Prop({ type: Date })
  releasedToProcurementAt: Date;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);
UnitSchema.index({ machineId: 1 });
UnitSchema.index({ projectId: 1 });

@Schema({ timestamps: true, collection: 'equipmentmodules' })
export class EquipmentModule extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'Unit', required: true })
  unitId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Machine', required: true })
  machineId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project', required: true })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User' })
  ownerId: DatabaseId;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const EquipmentModuleSchema = SchemaFactory.createForClass(EquipmentModule);
EquipmentModuleSchema.index({ unitId: 1 });
EquipmentModuleSchema.index({ machineId: 1 });
EquipmentModuleSchema.index({ projectId: 1 });

@Schema({ timestamps: true, collection: 'controlmodules' })
export class ControlModule extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'EquipmentModule', required: true })
  equipmentModuleId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Unit', required: true })
  unitId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Machine', required: true })
  machineId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Project' })
  projectId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'User' })
  ownerId: DatabaseId;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ControlModuleSchema = SchemaFactory.createForClass(ControlModule);
ControlModuleSchema.index({ equipmentModuleId: 1 });
ControlModuleSchema.index({ machineId: 1 });

export { Unit as Module, EquipmentModule as Subassembly };
export const ModuleSchema = UnitSchema;
export const SubassemblySchema = EquipmentModuleSchema;
