import { Injectable } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Project } from '../../schemas/project.schema';
import { Task } from '../../schemas/task.schema';
import { Deliverable } from '../../schemas/deliverable.schema';
import { ProcurementItem } from '../../schemas/procurement.schema';
import { Component } from '../../schemas/component.schema';
import { Unit, Machine } from '../../schemas/machine.schema';
import { Opportunity } from '../../schemas/opportunity.schema';
import { Customer } from '../../schemas/customer.schema';
import {
  ComponentAssemblyStatus,
  ComponentDesignStatus,
  ComponentLifecycleStage,
  ComponentProcurementStatus,
  ModuleCoordinationStatus,
  OpportunityStatus,
  ProcurementStatus,
  ProjectHealth,
  TaskStatus,
} from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectPgModel(Project.name) private projectModel: Model<Project>,
    @InjectPgModel(Task.name) private taskModel: Model<Task>,
    @InjectPgModel(Deliverable.name) private deliverableModel: Model<Deliverable>,
    @InjectPgModel(ProcurementItem.name) private procurementItemModel: Model<ProcurementItem>,
    @InjectPgModel(Component.name) private componentModel: Model<Component>,
    @InjectPgModel(Unit.name) private unitModel: Model<Unit>,
    @InjectPgModel(Machine.name) private machineModel: Model<Machine>,
    @InjectPgModel(Opportunity.name) private opportunityModel: Model<Opportunity>,
    @InjectPgModel(Customer.name) private customerModel: Model<Customer>,
  ) {}

  async getExecutiveDashboard(scopeUserId?: string) {
    const now = new Date();
    const projectFilter: Record<string, any> = { deletedAt: null };
    if (scopeUserId) {
      projectFilter.projectManagerId = new DatabaseId(scopeUserId);
    }

    // Resolve active project IDs first so every task/component query is scoped to live projects only
    const activeProjectIds = await this.projectModel.distinct('_id', projectFilter);

    const [
      projects,
      healthCounts,
      overdueTasks,
      blockedTasks,
      departmentBottlenecks,
      delayedComponents,
      totalModules,
      modulesReadyForProcurement,
      blockedModules,
      longLeadRisks,
      alertTasks,
      taskStatsByProject,
      opportunityPipeline,
      totalCustomers,
      totalMachines,
      componentDesignBuckets,
    ] = await Promise.all([
      // Full project list with customer + PM populated
      this.projectModel
        .find(projectFilter)
        .populate('customerId', 'name')
        .populate('projectManagerId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .lean(),

      // Health aggregation
      this.projectModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$health', count: { $sum: 1 } } },
      ]),

      // Overdue task count — scoped to active projects
      this.taskModel.countDocuments({
        deletedAt: null,
        projectId: { $in: activeProjectIds },
        dueDate: { $lt: now },
        status: { $nin: [TaskStatus.CLOSED, TaskStatus.RELEASED] },
      }),

      // Blocked task count — scoped to active projects
      this.taskModel.countDocuments({ deletedAt: null, projectId: { $in: activeProjectIds }, status: TaskStatus.BLOCKED }),

      // Department bottleneck aggregation — scoped to active projects
      this.taskModel.aggregate([
        { $match: { deletedAt: null, projectId: { $in: activeProjectIds }, status: TaskStatus.BLOCKED } },
        { $group: { _id: '$departmentId', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        { $project: { departmentName: '$department.name', count: 1 } },
        { $sort: { count: -1 } },
      ]),

      // Delayed components — scoped to active projects
      this.componentModel.countDocuments({ deletedAt: null, projectId: { $in: activeProjectIds }, isDelayed: true }),

      this.unitModel.countDocuments({ deletedAt: null, projectId: { $in: activeProjectIds } }),
      this.unitModel.countDocuments({ deletedAt: null, projectId: { $in: activeProjectIds }, status: ModuleCoordinationStatus.READY_FOR_PROCUREMENT }),
      this.unitModel.countDocuments({ deletedAt: null, projectId: { $in: activeProjectIds }, status: ModuleCoordinationStatus.BLOCKED }),
      this.componentModel.countDocuments({ deletedAt: null, projectId: { $in: activeProjectIds }, longLeadRisk: true }),

      // Top 12 alert tasks (blocked + overdue, most urgent first) — scoped to active projects
      this.taskModel
        .find({
          deletedAt: null,
          projectId: { $in: activeProjectIds },
          $or: [
            { status: TaskStatus.BLOCKED },
            { dueDate: { $lt: now }, status: { $nin: [TaskStatus.CLOSED, TaskStatus.RELEASED] } },
          ],
        })
        .populate('ownerId', 'firstName lastName')
        .populate('projectId', 'name')
        .populate('departmentId', 'name')
        .sort({ status: -1, dueDate: 1 })
        .limit(12)
        .lean(),

      // Task totals + closed counts per project (for completion %)
      this.taskModel.aggregate([
        { $match: { deletedAt: null, projectId: { $in: activeProjectIds } } },
        {
          $group: {
            _id: '$projectId',
            total: { $sum: 1 },
            done: {
              $sum: {
                $cond: [{ $in: ['$status', [TaskStatus.CLOSED, TaskStatus.RELEASED]] }, 1, 0],
              },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ['$status', TaskStatus.BLOCKED] }, 1, 0] },
            },
          },
        },
      ]),

      // Opportunity pipeline counts by status
      this.opportunityModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Customers count (total live customer base)
      this.customerModel.countDocuments({ deletedAt: null }),

      // Machines count — scoped to active projects
      this.machineModel.countDocuments({ deletedAt: null, projectId: { $in: activeProjectIds } }),

      // Components grouped by design status — scoped to active projects
      this.componentModel.aggregate([
        { $match: { deletedAt: null, projectId: { $in: activeProjectIds } } },
        { $group: { _id: '$designStatus', count: { $sum: 1 } } },
      ]),
    ]);

    const healthMap: Record<string, number> = {};
    healthCounts.forEach((h: any) => { healthMap[h._id] = h.count; });

    const taskStatMap: Record<string, { total: number; done: number; blocked: number }> = {};
    taskStatsByProject.forEach((s: any) => {
      taskStatMap[s._id?.toString()] = { total: s.total, done: s.done, blocked: s.blocked };
    });

    const projectsWithStats = projects.map((p: any) => {
      const stats = taskStatMap[p._id.toString()] || { total: 0, done: 0, blocked: 0 };
      return {
        _id: p._id,
        name: p.name,
        health: p.health,
        stage: p.stage,
        priority: p.priority,
        targetDeliveryDate: p.targetDeliveryDate,
        createdAt: p.createdAt,
        customer: (p.customerId as any)?.name || null,
        projectManager: p.projectManagerId
          ? { firstName: (p.projectManagerId as any).firstName, lastName: (p.projectManagerId as any).lastName }
          : null,
        taskTotal: stats.total,
        taskDone: stats.done,
        taskBlocked: stats.blocked,
        completionPct: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
      };
    });

    const pipelineMap: Record<string, number> = {};
    opportunityPipeline.forEach((o: any) => { pipelineMap[o._id] = o.count; });

    const designMap: Record<string, number> = {};
    componentDesignBuckets.forEach((c: any) => { designMap[c._id] = c.count; });
    const totalComponents = Object.values(designMap).reduce((a, b) => a + b, 0);

    return {
      totalProjects: projects.length,
      totalCustomers,
      totalMachines,
      totalComponents,
      componentsByDesign: {
        notStarted:  designMap[ComponentDesignStatus.NOT_STARTED]  || 0,
        inDesign:    designMap[ComponentDesignStatus.IN_DESIGN]    || 0,
        underReview: designMap[ComponentDesignStatus.UNDER_REVIEW] || 0,
        released:    designMap[ComponentDesignStatus.RELEASED]     || 0,
      },
      healthy: healthMap[ProjectHealth.HEALTHY] || 0,
      watch: healthMap[ProjectHealth.WATCH] || 0,
      atRisk: healthMap[ProjectHealth.AT_RISK] || 0,
      delayed: healthMap[ProjectHealth.DELAYED] || 0,
      overdueTasks,
      blockedTasks,
      delayedComponents,
      totalModules,
      modulesReadyForProcurement,
      blockedModules,
      longLeadRisks,
      departmentBottlenecks,
      projects: projectsWithStats,
      alertTasks,
      opportunityPipeline: {
        new: pipelineMap[OpportunityStatus.NEW] || 0,
        underReview: pipelineMap[OpportunityStatus.UNDER_REVIEW] || 0,
        feasibility: pipelineMap[OpportunityStatus.FEASIBILITY_IN_PROGRESS] || 0,
        approved: pipelineMap[OpportunityStatus.APPROVED] || 0,
        converted: pipelineMap[OpportunityStatus.CONVERTED_TO_PROJECT] || 0,
      },
    };
  }

  async getProjectDashboard(projectId: string) {
    const now = new Date();
    const [project, taskStats, overdueTasks, blockedTasks, procurementSummary, componentSummary] = await Promise.all([
      this.projectModel.findById(projectId).populate('projectManagerId', 'firstName lastName').lean(),
      this.taskModel.aggregate([{ $match: { projectId: { $eq: projectId }, deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.taskModel.countDocuments({
        projectId,
        deletedAt: null,
        dueDate: { $lt: now },
        status: { $nin: [TaskStatus.CLOSED, TaskStatus.RELEASED] },
      }),
      this.taskModel.find({ projectId, deletedAt: null, status: TaskStatus.BLOCKED }).populate('ownerId', 'firstName lastName').lean(),
      this.procurementItemModel.aggregate([{ $match: { projectId: { $eq: projectId }, deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.getProjectComponentDashboard(projectId),
    ]);

    return { project, taskStats, overdueTasks, blockedTasks, procurementSummary, componentSummary };
  }

  async getDepartmentDashboard(departmentId: string) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [totalTasks, dueThisWeek, overdue, blocked, statusBreakdown] = await Promise.all([
      this.taskModel.countDocuments({ departmentId, deletedAt: null }),
      this.taskModel.countDocuments({
        departmentId,
        deletedAt: null,
        dueDate: { $gte: now, $lte: weekFromNow },
        status: { $nin: [TaskStatus.CLOSED, TaskStatus.RELEASED] },
      }),
      this.taskModel.countDocuments({
        departmentId,
        deletedAt: null,
        dueDate: { $lt: now },
        status: { $nin: [TaskStatus.CLOSED, TaskStatus.RELEASED] },
      }),
      this.taskModel.countDocuments({ departmentId, deletedAt: null, status: TaskStatus.BLOCKED }),
      this.taskModel.aggregate([{ $match: { departmentId: { $eq: departmentId }, deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return { totalTasks, dueThisWeek, overdue, blocked, statusBreakdown };
  }

  async getProcurementDashboard() {
    const [statusBreakdown, longLeadItems, changedAfterRelease] = await Promise.all([
      this.procurementItemModel.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.procurementItemModel.find({ isLongLead: true, deletedAt: null }).populate('supplierId', 'name').lean(),
      this.procurementItemModel.find({ status: ProcurementStatus.CHANGED_AFTER_RELEASE, deletedAt: null }).lean(),
    ]);

    return { statusBreakdown, longLeadItems, changedAfterRelease };
  }

  async getProjectComponentDashboard(projectId: string) {
    const now = new Date();
    const projectObjectId = new DatabaseId(projectId);

    const [machineBreakdown, totalComponents, completedComponents, delayedComponents, componentsBlockingProcurement, componentsBlockingAssembly, totalModules, modulesReadyForProcurement, blockedModules, longLeadRisks] = await Promise.all([
      this.componentModel.aggregate([
        { $match: { projectId: projectObjectId, deletedAt: null } },
        { $lookup: { from: 'machines', localField: 'machineId', foreignField: '_id', as: 'machine' } },
        { $unwind: '$machine' },
        {
          $group: {
            _id: '$machineId',
            machineName: { $first: '$machine.name' },
            totalComponents: { $sum: 1 },
            completedComponents: {
              $sum: { $cond: [{ $eq: ['$lifecycleStage', ComponentLifecycleStage.ASSEMBLY_READY] }, 1, 0] },
            },
            pendingComponents: {
              $sum: { $cond: [{ $ne: ['$lifecycleStage', ComponentLifecycleStage.ASSEMBLY_READY] }, 1, 0] },
            },
            delayedComponents: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ['$dueDate', now] },
                      { $ne: ['$lifecycleStage', ComponentLifecycleStage.ASSEMBLY_READY] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            blockingProcurement: { $sum: { $cond: ['$procurementBlocked', 1, 0] } },
            blockingAssembly: { $sum: { $cond: ['$assemblyBlocked', 1, 0] } },
          },
        },
        { $sort: { machineName: 1 } },
      ]),
      this.componentModel.countDocuments({ projectId: projectObjectId, deletedAt: null }),
      this.componentModel.countDocuments({ projectId: projectObjectId, deletedAt: null, lifecycleStage: ComponentLifecycleStage.ASSEMBLY_READY }),
      this.componentModel.countDocuments({
        projectId: projectObjectId,
        deletedAt: null,
        dueDate: { $lt: now },
        lifecycleStage: { $nin: [ComponentLifecycleStage.RECEIVED, ComponentLifecycleStage.ASSEMBLY_READY] },
      }),
      this.componentModel.countDocuments({ projectId: projectObjectId, deletedAt: null, procurementBlocked: true }),
      this.componentModel.countDocuments({ projectId: projectObjectId, deletedAt: null, assemblyBlocked: true }),
      this.unitModel.countDocuments({ projectId: projectObjectId, deletedAt: null }),
      this.unitModel.countDocuments({ projectId: projectObjectId, deletedAt: null, status: ModuleCoordinationStatus.READY_FOR_PROCUREMENT }),
      this.unitModel.countDocuments({ projectId: projectObjectId, deletedAt: null, status: ModuleCoordinationStatus.BLOCKED }),
      this.componentModel.countDocuments({ projectId: projectObjectId, deletedAt: null, longLeadRisk: true }),
    ]);

    return {
      totalComponents,
      completedComponents,
      pendingComponents: totalComponents - completedComponents,
      delayedComponents,
      componentsBlockingProcurement,
      componentsBlockingAssembly,
      totalModules,
      modulesReadyForProcurement,
      blockedModules,
      longLeadRisks,
      machineBreakdown,
    };
  }

  async getMachinesDashboard() {
    const [components, totalMachines] = await Promise.all([
      this.componentModel.find({ deletedAt: null }).lean(),
      this.componentModel.distinct('machineId', { deletedAt: null }).then((ids) => ids.length),
    ]);

    const byDesignStatus = Object.fromEntries(Object.values(ComponentDesignStatus).map((status) => [status, 0]));
    const byProcurementStatus = Object.fromEntries(Object.values(ComponentProcurementStatus).map((status) => [status, 0]));
    const byAssemblyStatus = Object.fromEntries(Object.values(ComponentAssemblyStatus).map((status) => [status, 0]));

    components.forEach((component: any) => {
      byDesignStatus[component.designStatus] = (byDesignStatus[component.designStatus] || 0) + 1;
      byProcurementStatus[component.procurementStatus] = (byProcurementStatus[component.procurementStatus] || 0) + 1;
      byAssemblyStatus[component.assemblyStatus] = (byAssemblyStatus[component.assemblyStatus] || 0) + 1;
    });

    return {
      totalMachines,
      delayed: components.filter((component: any) => component.isDelayed).length,
      byDesignStatus,
      byProcurementStatus,
      byAssemblyStatus,
    };
  }
}
