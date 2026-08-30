import * as XLSX from 'xlsx';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model as MongooseModel } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Component } from '../../schemas/component.schema';
import { ControlModule, EquipmentModule, Machine, Unit } from '../../schemas/machine.schema';
import { Task } from '../../schemas/task.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  ComponentDesignStatus,
  ComponentProcurementStatus,
  ModuleComponentStatus,
  ModuleCoordinationStatus,
  TaskStatus,
} from '../../common/enums';

type IdLike = DatabaseId | { toString(): string } | string;

@Injectable()
export class MachinesService {
  constructor(
    @InjectPgModel(Machine.name) private machineModel: MongooseModel<Machine>,
    @InjectPgModel(Unit.name) private unitModel: MongooseModel<Unit>,
    @InjectPgModel(EquipmentModule.name) private equipmentModuleModel: MongooseModel<EquipmentModule>,
    @InjectPgModel(ControlModule.name) private controlModuleModel: MongooseModel<ControlModule>,
    @InjectPgModel(Component.name) private componentModel: MongooseModel<Component>,
    @InjectPgModel(Task.name) private taskModel: MongooseModel<Task>,
    private auditLogService: AuditLogService,
  ) {}

  async createMachine(dto: Partial<Machine>, userId: string) {
    const machine = await this.machineModel.create(dto);
    await this.auditLogService.log({
      action: 'create',
      entityType: 'Machine',
      entityId: machine._id,
      performedBy: userId,
      projectId: dto.projectId,
      newValues: dto,
    });
    return machine;
  }

  async findMachines(projectId?: string) {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (projectId) filter.projectId = new DatabaseId(projectId);

    const [machines, units, components] = await Promise.all([
      this.machineModel.find(filter).populate('projectId', 'name').populate('ownerId', 'firstName lastName').sort({ sortOrder: 1, name: 1 }).lean(),
      this.unitModel.find(projectId ? { deletedAt: null, projectId: new DatabaseId(projectId) } : { deletedAt: null }).lean(),
      this.componentModel.find(projectId ? { deletedAt: null, projectId: new DatabaseId(projectId) } : { deletedAt: null }).lean(),
    ]);

    return machines.map((machine: any) => {
      const machineId = machine._id.toString();
      const machineUnits = units.filter((unit: any) => unit.machineId.toString() === machineId);
      const machineComponents = components.filter((component: any) => component.machineId.toString() === machineId);
      const released = machineComponents.filter((component: any) => component.designStatus === 'Released').length;
      const received = machineComponents.filter((component: any) => component.procurementStatus === 'Received').length;
      const installed = machineComponents.filter((component: any) => component.assemblyStatus === 'Installed').length;

      return {
        ...machine,
        unitCount: machineUnits.length,
        componentCount: machineComponents.length,
        delayedCount: machineComponents.filter((component: any) => component.isDelayed).length,
        designProgress: machineComponents.length ? Math.round((released / machineComponents.length) * 100) : 0,
        procurementProgress: machineComponents.length ? Math.round((received / machineComponents.length) * 100) : 0,
        assemblyProgress: machineComponents.length ? Math.round((installed / machineComponents.length) * 100) : 0,
      };
    });
  }

  async updateMachine(id: string, dto: Partial<Machine>, userId: string) {
    const machine = await this.machineModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: dto }, { new: true });
    if (!machine) throw new NotFoundException('Machine not found');
    await this.auditLogService.log({ action: 'update', entityType: 'Machine', entityId: id, performedBy: userId, projectId: machine.projectId, newValues: dto });
    return machine;
  }

  async createUnit(machineId: string, dto: Partial<Unit>, userId: string) {
    const machine = await this.requireMachine(machineId);
    const unit = await this.unitModel.create({
      status: ModuleCoordinationStatus.NOT_STARTED,
      deliverables: [],
      releaseReady: false,
      componentsLocked: false,
      ...dto,
      machineId: machine._id,
      projectId: machine.projectId,
    });
    await this.auditLogService.log({ action: 'create', entityType: 'Unit', entityId: unit._id, performedBy: userId, projectId: unit.projectId, newValues: unit.toObject() });
    return unit;
  }

  async findUnitsByMachine(machineId: string) {
    await this.requireMachine(machineId);
    return this.unitModel.find({ machineId: new DatabaseId(machineId), deletedAt: null }).populate('ownerId', 'firstName lastName').sort({ sortOrder: 1, name: 1 }).exec();
  }

  async updateUnit(id: string, dto: Partial<Unit>, userId: string) {
    const existing = await this.unitModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Unit not found');

    const unit = await this.unitModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: dto }, { new: true });
    if (!unit) throw new NotFoundException('Unit not found');
    const readiness = await this.getUnitReleaseReadiness(unit._id.toString());
    const releaseReady = readiness.allDeliverablesCompleted && readiness.criticalBlockedTasks === 0;
    const updatedUnit = await this.unitModel.findByIdAndUpdate(unit._id, { $set: { releaseReady } }, { new: true }).populate('ownerId', 'firstName lastName');
    await this.auditLogService.log({ action: 'update', entityType: 'Unit', entityId: id, performedBy: userId, projectId: unit.projectId, previousValues: existing.toObject(), newValues: dto });
    return updatedUnit;
  }

  async getProjectModules(projectId: string) {
    if (!DatabaseId.isValid(projectId)) throw new BadRequestException('Invalid projectId');
    const projectObjectId = new DatabaseId(projectId);
    const [units, machines, tasks, components] = await Promise.all([
      this.unitModel.find({ projectId: projectObjectId, deletedAt: null }).populate('ownerId', 'firstName lastName email').sort({ sortOrder: 1, name: 1 }).lean(),
      this.machineModel.find({ projectId: projectObjectId, deletedAt: null }).lean(),
      this.taskModel.find({ projectId: projectObjectId, deletedAt: null }).populate('ownerId', 'firstName lastName').sort({ dueDate: 1, title: 1 }).lean(),
      this.componentModel
        .find({ projectId: projectObjectId, deletedAt: null })
        .populate('ownerId', 'firstName lastName email')
        .populate('moduleId', 'name')
        .sort({ createdAt: -1, name: 1 })
        .lean(),
    ]);

    const machineMap = new Map(machines.map((machine: any) => [machine._id.toString(), machine]));

    return units.map((unit: any) => {
      const moduleTasks = tasks.filter((task: any) => task.moduleId?.toString() === unit._id.toString());
      const moduleComponents = components.filter((component: any) => (component.moduleId || component.unitId)?.toString() === unit._id.toString());
      const summary = this.buildModuleSummary(unit, machineMap.get(unit.machineId.toString()), moduleTasks, moduleComponents);
      return {
        ...summary,
        tasks: moduleTasks,
        components: moduleComponents,
      };
    });
  }

  async releaseUnitToProcurement(id: string, userId: string) {
    const unit = await this.requireUnit(id);
    const readiness = await this.getUnitReleaseReadiness(id);
    if (!readiness.allDeliverablesCompleted) {
      throw new BadRequestException('All module deliverables must be completed before release');
    }
    if (readiness.criticalBlockedTasks > 0) {
      throw new BadRequestException('Critical blocked tasks must be cleared before release');
    }

    const components = await this.componentModel.find({
      projectId: unit.projectId,
      deletedAt: null,
      $or: [{ moduleId: unit._id }, { unitId: unit._id }],
    });

    for (const component of components) {
      const nextProcurementStatus =
        component.procurementStatus === ComponentProcurementStatus.RECEIVED
          ? ComponentProcurementStatus.RECEIVED
          : component.status === ModuleComponentStatus.ORDERED
            ? ComponentProcurementStatus.ORDERED
            : ComponentProcurementStatus.READY;

      await this.componentModel.findByIdAndUpdate(component._id, {
        $set: {
          designStatus: ComponentDesignStatus.RELEASED,
          procurementStatus: nextProcurementStatus,
          procurementVisible: true,
          procurementBlocked: false,
          assemblyBlocked: nextProcurementStatus !== ComponentProcurementStatus.RECEIVED,
        },
      });
    }

    const updated = await this.unitModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: ModuleCoordinationStatus.READY_FOR_PROCUREMENT,
          releaseReady: true,
          componentsLocked: true,
          releasedToProcurementAt: new Date(),
        },
      },
      { new: true },
    ).populate('ownerId', 'firstName lastName email');

    await this.auditLogService.log({
      action: 'update',
      entityType: 'Unit',
      entityId: id,
      performedBy: userId,
      projectId: unit.projectId,
      newValues: { status: ModuleCoordinationStatus.READY_FOR_PROCUREMENT, releaseReady: true },
    });

    return {
      module: updated,
      releasedComponents: components.length,
    };
  }

  async createEquipmentModule(unitId: string, dto: Partial<EquipmentModule>, userId: string) {
    const unit = await this.requireUnit(unitId);
    const equipmentModule = await this.equipmentModuleModel.create({
      ...dto,
      unitId: unit._id,
      machineId: unit.machineId,
      projectId: unit.projectId,
    });
    await this.auditLogService.log({
      action: 'create',
      entityType: 'EquipmentModule',
      entityId: equipmentModule._id,
      performedBy: userId,
      projectId: equipmentModule.projectId,
      newValues: equipmentModule.toObject(),
    });
    return equipmentModule;
  }

  async findEquipmentModulesByUnit(unitId: string) {
    await this.requireUnit(unitId);
    return this.equipmentModuleModel.find({ unitId: new DatabaseId(unitId), deletedAt: null }).populate('ownerId', 'firstName lastName').sort({ sortOrder: 1, name: 1 }).exec();
  }

  async updateEquipmentModule(id: string, dto: Partial<EquipmentModule>, userId: string) {
    const equipmentModule = await this.equipmentModuleModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: dto }, { new: true });
    if (!equipmentModule) throw new NotFoundException('Equipment module not found');
    await this.auditLogService.log({ action: 'update', entityType: 'EquipmentModule', entityId: id, performedBy: userId, projectId: equipmentModule.projectId, newValues: dto });
    return equipmentModule;
  }

  async createControlModule(equipmentModuleId: string, dto: Partial<ControlModule>, userId: string) {
    const equipmentModule = await this.requireEquipmentModule(equipmentModuleId);
    const controlModule = await this.controlModuleModel.create({
      ...dto,
      equipmentModuleId: equipmentModule._id,
      unitId: equipmentModule.unitId,
      machineId: equipmentModule.machineId,
      projectId: equipmentModule.projectId,
    });
    await this.auditLogService.log({
      action: 'create',
      entityType: 'ControlModule',
      entityId: controlModule._id,
      performedBy: userId,
      projectId: controlModule.projectId,
      newValues: controlModule.toObject(),
    });
    return controlModule;
  }

  async findControlModulesByEquipmentModule(equipmentModuleId: string) {
    await this.requireEquipmentModule(equipmentModuleId);
    return this.controlModuleModel
      .find({ equipmentModuleId: new DatabaseId(equipmentModuleId), deletedAt: null })
      .populate('ownerId', 'firstName lastName')
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  async updateControlModule(id: string, dto: Partial<ControlModule>, userId: string) {
    const controlModule = await this.controlModuleModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: dto }, { new: true });
    if (!controlModule) throw new NotFoundException('Control module not found');
    await this.auditLogService.log({ action: 'update', entityType: 'ControlModule', entityId: id, performedBy: userId, projectId: controlModule.projectId, newValues: dto });
    return controlModule;
  }

  async getMachineTree(machineId: string): Promise<any> {
    const machine = await this.machineModel.findOne({ _id: machineId, deletedAt: null }).populate('projectId', 'name').populate('ownerId', 'firstName lastName').lean();
    if (!machine) throw new NotFoundException('Machine not found');

    const [units, equipmentModules, controlModules, components] = await Promise.all([
      this.unitModel.find({ machineId: machine._id, deletedAt: null }).populate('ownerId', 'firstName lastName').sort({ sortOrder: 1, name: 1 }).lean(),
      this.equipmentModuleModel.find({ machineId: machine._id, deletedAt: null }).populate('ownerId', 'firstName lastName').sort({ sortOrder: 1, name: 1 }).lean(),
      this.controlModuleModel.find({ machineId: machine._id, deletedAt: null }).populate('ownerId', 'firstName lastName').sort({ sortOrder: 1, name: 1 }).lean(),
      this.componentModel
        .find({ machineId: machine._id, deletedAt: null })
        .populate('ownerId', 'firstName lastName')
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ]);

    const componentsFor = (type: string, id: IdLike) => components.filter((component: any) => component.parentType === type && component.parentId?.toString() === id.toString());

    const controlModulesByEquipmentModule = new Map<string, any[]>();
    controlModules.forEach((controlModule: any) => {
      const key = controlModule.equipmentModuleId.toString();
      const bucket = controlModulesByEquipmentModule.get(key) || [];
      bucket.push({
        ...controlModule,
        components: componentsFor('ControlModule', controlModule._id),
      });
      controlModulesByEquipmentModule.set(key, bucket);
    });

    const equipmentModulesByUnit = new Map<string, any[]>();
    equipmentModules.forEach((equipmentModule: any) => {
      const key = equipmentModule.unitId.toString();
      const bucket = equipmentModulesByUnit.get(key) || [];
      bucket.push({
        ...equipmentModule,
        controlModules: controlModulesByEquipmentModule.get(equipmentModule._id.toString()) || [],
        components: componentsFor('EquipmentModule', equipmentModule._id),
      });
      equipmentModulesByUnit.set(key, bucket);
    });

    return {
      ...machine,
      units: units.map((unit: any) => ({
        ...unit,
        equipmentModules: equipmentModulesByUnit.get(unit._id.toString()) || [],
        components: componentsFor('Unit', unit._id),
      })),
      components: componentsFor('Machine', machine._id),
    };
  }

  async getMachineStats(machineId: string) {
    await this.requireMachine(machineId);
    const machineObjectId = new DatabaseId(machineId);
    const [units, equipmentModules, controlModules, components, recentActivity] = await Promise.all([
      this.unitModel.countDocuments({ machineId: machineObjectId, deletedAt: null }),
      this.equipmentModuleModel.countDocuments({ machineId: machineObjectId, deletedAt: null }),
      this.controlModuleModel.countDocuments({ machineId: machineObjectId, deletedAt: null }),
      this.componentModel.find({ machineId: machineObjectId, deletedAt: null }).sort({ sortOrder: 1, name: 1 }).lean(),
      this.auditLogService.findByEntity('Machine', machineId).then((logs) => logs.slice(0, 5)),
    ]);

    const totalComponents = components.length;
    const released = components.filter((component: any) => component.designStatus === 'Released').length;
    const received = components.filter((component: any) => component.procurementStatus === 'Received').length;
    const installed = components.filter((component: any) => component.assemblyStatus === 'Installed').length;

    return {
      units,
      equipmentModules,
      controlModules,
      components: totalComponents,
      delayed: components.filter((component: any) => component.isDelayed).length,
      designProgress: totalComponents ? Math.round((released / totalComponents) * 100) : 0,
      procurementProgress: totalComponents ? Math.round((received / totalComponents) * 100) : 0,
      assemblyProgress: totalComponents ? Math.round((installed / totalComponents) * 100) : 0,
      recentActivity,
    };
  }

  async reorderUnits(ids: string[]) {
    await Promise.all(ids.map((id, index) => this.unitModel.findByIdAndUpdate(id, { sortOrder: index })));
    return { reordered: true };
  }

  async reorderEquipmentModules(ids: string[]) {
    await Promise.all(ids.map((id, index) => this.equipmentModuleModel.findByIdAndUpdate(id, { sortOrder: index })));
    return { reordered: true };
  }

  async reorderControlModules(ids: string[]) {
    await Promise.all(ids.map((id, index) => this.controlModuleModel.findByIdAndUpdate(id, { sortOrder: index })));
    return { reordered: true };
  }

  async deleteUnit(id: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new BadRequestException('Invalid unit id');
    const unit = await this.unitModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!unit) throw new NotFoundException('Unit not found');
    const ems = await this.equipmentModuleModel.find({ unitId: unit._id, deletedAt: null }).lean();
    const emIds = ems.map((em: any) => em._id);
    if (emIds.length) await this.controlModuleModel.updateMany({ equipmentModuleId: { $in: emIds }, deletedAt: null }, { $set: { deletedAt: new Date() } });
    await this.equipmentModuleModel.updateMany({ unitId: unit._id, deletedAt: null }, { $set: { deletedAt: new Date() } });
    await this.auditLogService.log({ action: 'delete', entityType: 'Unit', entityId: id, performedBy: userId, projectId: unit.projectId });
    return { deleted: true };
  }

  async deleteEquipmentModule(id: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new BadRequestException('Invalid equipment module id');
    const em = await this.equipmentModuleModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!em) throw new NotFoundException('Equipment module not found');
    await this.controlModuleModel.updateMany({ equipmentModuleId: em._id, deletedAt: null }, { $set: { deletedAt: new Date() } });
    await this.auditLogService.log({ action: 'delete', entityType: 'EquipmentModule', entityId: id, performedBy: userId, projectId: em.projectId });
    return { deleted: true };
  }

  async deleteControlModule(id: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new BadRequestException('Invalid control module id');
    const cm = await this.controlModuleModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!cm) throw new NotFoundException('Control module not found');
    await this.auditLogService.log({ action: 'delete', entityType: 'ControlModule', entityId: id, performedBy: userId, projectId: cm.projectId });
    return { deleted: true };
  }

  async importTree(machineId: string, buffer: Buffer, userId: string) {
    const machine = await this.requireMachine(machineId);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

    if (!rows.length) throw new BadRequestException('File is empty or has no parseable rows');

    const existingUnits = await this.unitModel.find({ machineId: machine._id, deletedAt: null }).lean();
    const existingEMs = await this.equipmentModuleModel.find({ machineId: machine._id, deletedAt: null }).lean();
    const existingCMs = await this.controlModuleModel.find({ machineId: machine._id, deletedAt: null }).lean();

    const unitMap = new Map<string, any>();
    existingUnits.forEach((u: any) => unitMap.set(u.name.toLowerCase(), u));
    const emMap = new Map<string, any>();
    existingEMs.forEach((em: any) => emMap.set(`${em.unitId}:${em.name.toLowerCase()}`, em));
    const cmSet = new Set<string>();
    existingCMs.forEach((cm: any) => cmSet.add(`${cm.equipmentModuleId}:${cm.name.toLowerCase()}`));

    // Flexible column detection
    const keys = Object.keys(rows[0] || {});
    const unitCol  = keys.find((k) => /^unit$/i.test(k.trim()))             ?? keys[0] ?? '';
    const emCol    = keys.find((k) => /equipment.?module/i.test(k.trim()))  ?? keys[1] ?? '';
    const cmCol    = keys.find((k) => /control.?module/i.test(k.trim()))    ?? keys[2] ?? '';

    let unitsCreated = 0, emsCreated = 0, cmsCreated = 0;

    for (const row of rows) {
      const unitName = (row[unitCol] ?? '').toString().trim();
      const emName   = (row[emCol]   ?? '').toString().trim();
      const cmName   = (row[cmCol]   ?? '').toString().trim();
      if (!unitName) continue;

      let unit = unitMap.get(unitName.toLowerCase());
      if (!unit) {
        unit = await this.unitModel.create({ name: unitName, machineId: machine._id, projectId: machine.projectId });
        unitMap.set(unitName.toLowerCase(), unit);
        unitsCreated++;
        await this.auditLogService.log({ action: 'create', entityType: 'Unit', entityId: unit._id, performedBy: userId, projectId: unit.projectId, newValues: unit.toObject() });
      }

      if (!emName) continue;
      const emKey = `${unit._id}:${emName.toLowerCase()}`;
      let em = emMap.get(emKey);
      if (!em) {
        em = await this.equipmentModuleModel.create({ name: emName, unitId: unit._id, machineId: machine._id, projectId: machine.projectId });
        emMap.set(emKey, em);
        emsCreated++;
        await this.auditLogService.log({ action: 'create', entityType: 'EquipmentModule', entityId: em._id, performedBy: userId, projectId: em.projectId, newValues: em.toObject() });
      }

      if (!cmName) continue;
      const cmKey = `${em._id}:${cmName.toLowerCase()}`;
      if (!cmSet.has(cmKey)) {
        const cm = await this.controlModuleModel.create({ name: cmName, equipmentModuleId: em._id, unitId: unit._id, machineId: machine._id, projectId: machine.projectId });
        cmSet.add(cmKey);
        cmsCreated++;
        await this.auditLogService.log({ action: 'create', entityType: 'ControlModule', entityId: cm._id, performedBy: userId, projectId: cm.projectId, newValues: cm.toObject() });
      }
    }

    return { unitsCreated, emsCreated, cmsCreated, totalRows: rows.length };
  }

  private async getUnitReleaseReadiness(unitId: string) {
    const objectId = new DatabaseId(unitId);
    const [unit, tasks] = await Promise.all([
      this.unitModel.findById(objectId).lean(),
      this.taskModel.find({ moduleId: objectId, deletedAt: null }).lean(),
    ]);
    if (!unit) throw new NotFoundException('Unit not found');

    const deliverables = unit.deliverables || [];
    return {
      allDeliverablesCompleted: deliverables.every((deliverable: any) => deliverable.completed),
      criticalBlockedTasks: tasks.filter((task: any) => task.status === TaskStatus.BLOCKED && task.priority === 'critical').length,
    };
  }

  private buildModuleSummary(unit: any, machine: any, tasks: any[], components: any[]) {
    const deliverables = unit.deliverables || [];
    const completedDeliverables = deliverables.filter((deliverable: any) => deliverable.completed).length;
    const blockedTasks = tasks.filter((task: any) => task.status === TaskStatus.BLOCKED);
    const criticalBlockedTasks = blockedTasks.filter((task: any) => task.priority === 'critical');
    const openTasks = tasks.filter((task: any) => ![TaskStatus.CLOSED, TaskStatus.RELEASED].includes(task.status));
    const releaseEligible = deliverables.every((deliverable: any) => deliverable.completed) && criticalBlockedTasks.length === 0;
    const longLeadRisks = components.filter((component: any) => component.longLeadRisk);
    const effectiveStatus =
      unit.status === ModuleCoordinationStatus.READY_FOR_PROCUREMENT
        ? ModuleCoordinationStatus.READY_FOR_PROCUREMENT
        : blockedTasks.length > 0
          ? ModuleCoordinationStatus.BLOCKED
          : openTasks.length === 0 && (tasks.length > 0 || deliverables.length > 0) && completedDeliverables === deliverables.length
            ? ModuleCoordinationStatus.COMPLETED
            : completedDeliverables > 0 || tasks.length > 0 || components.length > 0
              ? ModuleCoordinationStatus.IN_PROGRESS
              : ModuleCoordinationStatus.NOT_STARTED;

    return {
      ...unit,
      machineName: machine?.name || 'Unknown machine',
      status: effectiveStatus,
      deliverableCount: deliverables.length,
      completedDeliverables,
      blockerCount: blockedTasks.length,
      criticalBlockedTasks: criticalBlockedTasks.length,
      taskCount: tasks.length,
      openTaskCount: openTasks.length,
      componentCount: components.length,
      longLeadRiskCount: longLeadRisks.length,
      releaseEligible,
    };
  }

  private async requireMachine(machineId: string) {
    if (!DatabaseId.isValid(machineId)) throw new BadRequestException('Invalid machineId');
    const machine = await this.machineModel.findOne({ _id: machineId, deletedAt: null });
    if (!machine) throw new NotFoundException('Machine not found');
    return machine;
  }

  private async requireUnit(unitId: string) {
    if (!DatabaseId.isValid(unitId)) throw new BadRequestException('Invalid unitId');
    const unit = await this.unitModel.findOne({ _id: unitId, deletedAt: null });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  private async requireEquipmentModule(equipmentModuleId: string) {
    if (!DatabaseId.isValid(equipmentModuleId)) throw new BadRequestException('Invalid equipment module id');
    const equipmentModule = await this.equipmentModuleModel.findOne({ _id: equipmentModuleId, deletedAt: null });
    if (!equipmentModule) throw new NotFoundException('Equipment module not found');
    return equipmentModule;
  }
}
