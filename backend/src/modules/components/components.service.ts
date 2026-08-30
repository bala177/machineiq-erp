import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Component } from '../../schemas/component.schema';
import { Deliverable } from '../../schemas/deliverable.schema';
import { ControlModule, EquipmentModule, Machine, Unit } from '../../schemas/machine.schema';
import { Project } from '../../schemas/project.schema';
import { Item } from '../../schemas/item.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ComponentAssemblyStatus,
  ComponentDesignStatus,
  ComponentLifecycleStage,
  ComponentProcurementStatus,
  MachineNodeType,
  ModuleComponentStatus,
  NotificationType,
} from '../../common/enums';

const ACTIVE_DESIGN_STATUSES = [
  ComponentDesignStatus.NOT_STARTED,
  ComponentDesignStatus.IN_DESIGN,
  ComponentDesignStatus.UNDER_REVIEW,
];

@Injectable()
export class ComponentsService {
  constructor(
    @InjectPgModel(Component.name) private componentModel: Model<Component>,
    @InjectPgModel(Project.name) private projectModel: Model<Project>,
    @InjectPgModel(Deliverable.name) private deliverableModel: Model<Deliverable>,
    @InjectPgModel(Machine.name) private machineModel: Model<Machine>,
    @InjectPgModel(Unit.name) private unitModel: Model<Unit>,
    @InjectPgModel(EquipmentModule.name) private equipmentModuleModel: Model<EquipmentModule>,
    @InjectPgModel(ControlModule.name) private controlModuleModel: Model<ControlModule>,
    @InjectPgModel(Item.name) private itemModel: Model<Item>,
    private auditLogService: AuditLogService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: Partial<Component>, userId: string) {
    const payload = await this.preparePayload(dto);
    // The normalized payload intentionally includes legacy compatibility fields
    // that PostgreSQL accepts at runtime but are cumbersome for TS to infer here.
    const component = await this.componentModel.create(payload as any);

    await this.auditLogService.log({
      action: 'create',
      entityType: 'Component',
      entityId: component._id,
      performedBy: userId,
      projectId: component.projectId,
      newValues: payload,
    });

    if (component.ownerId && component.ownerId.toString() !== userId) {
      await this.notificationsService.create({
        userId: component.ownerId,
        title: 'Component Assigned',
        message: `You have been assigned component "${component.name}"`,
        type: NotificationType.ASSIGNMENT,
        projectId: component.projectId,
        link: `/machines/${component.machineId}`,
      });
    }

    return this.findById(component._id.toString());
  }

  async findAll(query: {
    projectId?: string;
    machineId?: string;
    ownerId?: string;
    designStatus?: string;
    procurementStatus?: string;
    assemblyStatus?: string;
    discipline?: string;
    isDelayed?: string;
  }) {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (query.projectId) filter.projectId = new DatabaseId(query.projectId);
    if (query.machineId) filter.machineId = new DatabaseId(query.machineId);
    if (query.ownerId) filter.ownerId = new DatabaseId(query.ownerId);
    if (query.designStatus) filter.designStatus = query.designStatus;
    if (query.procurementStatus) filter.procurementStatus = query.procurementStatus;
    if (query.assemblyStatus) filter.assemblyStatus = query.assemblyStatus;
    if (query.discipline) filter.discipline = query.discipline;
    if (query.isDelayed === 'true') filter.isDelayed = true;
    if (query.isDelayed === 'false') filter.isDelayed = false;

    return this.componentModel
      .find(filter)
      .populate('ownerId', 'firstName lastName email role')
      .populate('machineId', 'name')
      .populate('moduleId', 'name status department plannedEndDate releaseReady')
      .populate('unitId', 'name')
      .populate('equipmentModuleId', 'name')
      .populate('controlModuleId', 'name')
      .populate('itemId', 'code name itemType uomId standardCost leadTimeDays')
      .sort({ machineId: 1, sortOrder: 1, name: 1 })
      .exec();
  }

  async findById(id: string) {
    const component = await this.componentModel
      .findOne({ _id: id, deletedAt: null })
      .populate('ownerId', 'firstName lastName email role')
      .populate('machineId', 'name')
      .populate('moduleId', 'name status department plannedEndDate releaseReady')
      .populate('unitId', 'name')
      .populate('equipmentModuleId', 'name')
      .populate('controlModuleId', 'name')
      .populate('itemId', 'code name itemType uomId standardCost leadTimeDays')
      .exec();

    if (!component) throw new NotFoundException('Component not found');
    return component;
  }

  async update(id: string, dto: Partial<Component>, userId: string) {
    const existing = await this.componentModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Component not found');

    const payload = await this.preparePayload({ ...existing.toObject(), ...dto }, existing);
    const updated = await this.componentModel.findByIdAndUpdate(id, { $set: payload }, { new: true });

    await this.auditLogService.log({
      action: 'update',
      entityType: 'Component',
      entityId: id,
      performedBy: userId,
      projectId: existing.projectId,
      previousValues: existing.toObject(),
      newValues: payload,
    });

    if (existing.ownerId?.toString() !== updated?.ownerId?.toString()) {
      await this.notificationsService.create({
        userId: updated!.ownerId,
        title: 'Component Reassigned',
        message: `You are now the owner of component "${updated!.name}"`,
        type: NotificationType.ASSIGNMENT,
        projectId: updated!.projectId,
        link: `/machines/${updated!.machineId}`,
      });
    }

    return this.findById(id);
  }

  async softDelete(id: string, userId: string) {
    const existing = await this.componentModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Component not found');

    await this.componentModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true });
    await this.auditLogService.log({
      action: 'delete',
      entityType: 'Component',
      entityId: id,
      performedBy: userId,
      projectId: existing.projectId,
      previousValues: existing.toObject(),
    });

    return { message: 'Component deleted' };
  }

  async linkItem(id: string, itemId: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Component not found');
    const [component, item] = await Promise.all([
      this.componentModel.findOne({ _id: id, deletedAt: null }),
      DatabaseId.isValid(itemId) ? this.itemModel.findOne({ _id: itemId, isActive: true, deletedAt: null }) : null,
    ]);
    if (!component) throw new NotFoundException('Component not found');
    if (!item) throw new BadRequestException('Item is invalid or inactive');
    const previousItemId = component.itemId;
    component.itemId = item._id;
    await component.save();
    await this.auditLogService.log({
      action: 'link_item', entityType: 'Component', entityId: component._id, performedBy: userId, projectId: component.projectId,
      previousValues: { itemId: previousItemId }, newValues: { itemId: item._id },
    });
    return this.findById(id);
  }

  async syncProjectState(projectId: string) {
    const components = await this.componentModel.find({ projectId: new DatabaseId(projectId), deletedAt: null });
    for (const component of components) {
      const payload = await this.preparePayload(component.toObject(), component);
      await this.componentModel.findByIdAndUpdate(component._id, { $set: payload });
    }
    return this.findAll({ projectId });
  }

  async processReminders(projectId?: string) {
    const now = new Date();
    const reminderCutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const filter: Record<string, unknown> = {
      deletedAt: null,
      dueDate: { $exists: true, $ne: null },
      designStatus: { $in: ACTIVE_DESIGN_STATUSES },
    };
    if (projectId) filter.projectId = new DatabaseId(projectId);

    const components = await this.componentModel.find(filter);
    const summary = { reminders: 0, overdue: 0, escalations: 0 };

    for (const component of components) {
      if (!component.ownerId || !component.dueDate) continue;

      const isOverdue = component.dueDate < now;
      const isDueSoon = component.dueDate >= now && component.dueDate <= reminderCutoff;

      if (isDueSoon && !component.reminderSentAt) {
        await this.notificationsService.create({
          userId: component.ownerId,
          title: 'Component Due Soon',
          message: `Component "${component.name}" is due by ${component.dueDate.toDateString()}.`,
          type: NotificationType.DUE_REMINDER,
          projectId: component.projectId,
          link: `/machines/${component.machineId}`,
        });
        component.reminderSentAt = now;
        summary.reminders += 1;
      }

      if (isOverdue && !component.overdueNotifiedAt) {
        await this.notificationsService.create({
          userId: component.ownerId,
          title: 'Component Overdue',
          message: `Component "${component.name}" is overdue.`,
          type: NotificationType.OVERDUE,
          projectId: component.projectId,
          link: `/machines/${component.machineId}`,
        });
        component.overdueNotifiedAt = now;
        summary.overdue += 1;
      }

      await component.save();
    }

    return summary;
  }

  private async preparePayload(dto: Partial<Component>, existing?: any) {
    await this.validateReferences(dto, existing?._id.toString());
    const ancestry = await this.resolveAncestry(dto.parentType!, dto.parentId!);
    const workflow = this.applyWorkflow(dto, existing);
    const ownerId = dto.ownerId || ancestry.ownerId || existing?.ownerId;
    if (!ownerId) throw new BadRequestException('ownerId is required');

    return {
      ...dto,
      name: dto.name || dto.partName || existing?.name,
      partName: dto.partName || dto.name || existing?.partName,
      quantity: dto.quantity ?? existing?.quantity ?? 1,
      status: dto.status || existing?.status || ModuleComponentStatus.PLANNED,
      leadTimeWeeks: Number(dto.leadTimeWeeks ?? existing?.leadTimeWeeks ?? 0),
      longLeadRisk: Number(dto.leadTimeWeeks ?? existing?.leadTimeWeeks ?? 0) >= 8 && (dto.status || existing?.status || ModuleComponentStatus.PLANNED) !== ModuleComponentStatus.ORDERED,
      ...ancestry,
      ownerId,
      ...workflow,
      delayedAt: workflow.isDelayed && !existing?.isDelayed ? new Date() : workflow.isDelayed ? existing?.delayedAt : null,
      procurementVisible: workflow.designStatus === ComponentDesignStatus.RELEASED,
      procurementBlocked: workflow.designStatus !== ComponentDesignStatus.RELEASED,
      assemblyBlocked: workflow.procurementStatus !== ComponentProcurementStatus.RECEIVED,
    };
  }

  private async validateReferences(dto: Partial<Component>, currentId?: string) {
    if (!dto.projectId) throw new BadRequestException('projectId is required');
    if (!dto.parentType || !dto.parentId) throw new BadRequestException('parentType and parentId are required');

    if (dto.itemId) {
      const item = await this.itemModel.findOne({ _id: dto.itemId, isActive: true, deletedAt: null });
      if (!item) throw new BadRequestException('Item is invalid or inactive');
    }

    if (dto.dependencyIds?.length) {
      const dependencies = await this.componentModel.find({ _id: { $in: dto.dependencyIds }, deletedAt: null });
      if (dependencies.length !== dto.dependencyIds.length) throw new BadRequestException('One or more dependencies do not exist');
      dependencies.forEach((dependency) => {
        if (currentId && dependency._id.toString() === currentId) throw new BadRequestException('A component cannot depend on itself');
      });
    }

    if (dto.deliverableIds?.length) {
      const deliverables = await this.deliverableModel.find({ _id: { $in: dto.deliverableIds }, projectId: dto.projectId, deletedAt: null });
      if (deliverables.length !== dto.deliverableIds.length) throw new BadRequestException('One or more deliverables are invalid for this project');
    }
  }

  private applyWorkflow(dto: Partial<Component>, existing?: Component) {
    let designStatus = dto.designStatus || existing?.designStatus || ComponentDesignStatus.NOT_STARTED;
    let procurementStatus = dto.procurementStatus || existing?.procurementStatus || ComponentProcurementStatus.NOT_READY;
    let assemblyStatus = dto.assemblyStatus || existing?.assemblyStatus || ComponentAssemblyStatus.NOT_READY;

    const moduleStatus = dto.status || existing?.status || ModuleComponentStatus.PLANNED;

    if (designStatus === ComponentDesignStatus.RELEASED && procurementStatus === ComponentProcurementStatus.NOT_READY) {
      procurementStatus = ComponentProcurementStatus.READY;
    }

    if (moduleStatus === ModuleComponentStatus.ORDERED) {
      procurementStatus = procurementStatus === ComponentProcurementStatus.RECEIVED ? ComponentProcurementStatus.RECEIVED : ComponentProcurementStatus.ORDERED;
    }

    if (procurementStatus === ComponentProcurementStatus.RECEIVED && assemblyStatus === ComponentAssemblyStatus.NOT_READY) {
      assemblyStatus = ComponentAssemblyStatus.READY;
    }

    const lifecycleStage = this.toLegacyLifecycleStage(designStatus, procurementStatus, assemblyStatus);
    const isDelayed = !!dto.dueDate && new Date(dto.dueDate) < new Date() && designStatus !== ComponentDesignStatus.RELEASED;

    return {
      designStatus,
      procurementStatus,
      assemblyStatus,
      lifecycleStage,
      isDelayed,
      releasedAt: designStatus === ComponentDesignStatus.RELEASED ? existing?.releasedAt || new Date() : existing?.releasedAt || null,
      receivedAt: procurementStatus === ComponentProcurementStatus.RECEIVED ? existing?.receivedAt || new Date() : existing?.receivedAt || null,
      assemblyReadyAt: assemblyStatus !== ComponentAssemblyStatus.NOT_READY ? existing?.assemblyReadyAt || new Date() : existing?.assemblyReadyAt || null,
    };
  }

  private toLegacyLifecycleStage(
    designStatus: ComponentDesignStatus,
    procurementStatus: ComponentProcurementStatus,
    assemblyStatus: ComponentAssemblyStatus,
  ) {
    if (assemblyStatus === ComponentAssemblyStatus.INSTALLED) return ComponentLifecycleStage.ASSEMBLY_READY;
    if (procurementStatus === ComponentProcurementStatus.RECEIVED) return ComponentLifecycleStage.RECEIVED;
    if (procurementStatus === ComponentProcurementStatus.ORDERED) return ComponentLifecycleStage.ORDERED;
    if (procurementStatus === ComponentProcurementStatus.READY) return ComponentLifecycleStage.PROCUREMENT_READY;
    if (designStatus === ComponentDesignStatus.RELEASED) return ComponentLifecycleStage.RELEASE;
    if (designStatus === ComponentDesignStatus.UNDER_REVIEW) return ComponentLifecycleStage.REVIEW;
    return ComponentLifecycleStage.DESIGN;
  }

  private async resolveAncestry(parentType: MachineNodeType, parentId: DatabaseId) {
    switch (parentType) {
      case MachineNodeType.MACHINE: {
        const machine = await this.machineModel.findOne({ _id: parentId, deletedAt: null });
        if (!machine) throw new NotFoundException('Machine not found');
        return { machineId: machine._id, projectId: machine.projectId, parentType, parentId, moduleId: null, unitId: null, equipmentModuleId: null, controlModuleId: null, ownerId: machine.ownerId ?? null };
      }
      case MachineNodeType.UNIT: {
        const unit = await this.unitModel.findOne({ _id: parentId, deletedAt: null });
        if (!unit) throw new NotFoundException('Unit not found');
        return { machineId: unit.machineId, projectId: unit.projectId, parentType, parentId, moduleId: unit._id, unitId: unit._id, equipmentModuleId: null, controlModuleId: null, ownerId: unit.ownerId ?? null };
      }
      case MachineNodeType.EQUIPMENT_MODULE: {
        const equipmentModule = await this.equipmentModuleModel.findOne({ _id: parentId, deletedAt: null });
        if (!equipmentModule) throw new NotFoundException('Equipment module not found');
        return {
          machineId: equipmentModule.machineId,
          projectId: equipmentModule.projectId,
          parentType,
          parentId,
          moduleId: equipmentModule.unitId,
          unitId: equipmentModule.unitId,
          equipmentModuleId: equipmentModule._id,
          controlModuleId: null,
          ownerId: equipmentModule.ownerId ?? null,
        };
      }
      case MachineNodeType.CONTROL_MODULE: {
        const controlModule = await this.controlModuleModel.findOne({ _id: parentId, deletedAt: null });
        if (!controlModule) throw new NotFoundException('Control module not found');
        return {
          machineId: controlModule.machineId,
          projectId: controlModule.projectId,
          parentType,
          parentId,
          moduleId: controlModule.unitId,
          unitId: controlModule.unitId,
          equipmentModuleId: controlModule.equipmentModuleId,
          controlModuleId: controlModule._id,
          ownerId: controlModule.ownerId ?? null,
        };
      }
      default:
        throw new BadRequestException('Unsupported parentType');
    }
  }
}
