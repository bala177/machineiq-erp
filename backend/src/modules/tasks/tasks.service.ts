import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Task } from '../../schemas/task.schema';
import { TaskStatus, Priority, NotificationType } from '../../common/enums';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';

const VALID_STATUSES = new Set<string>(Object.values(TaskStatus));
const VALID_PRIORITIES = new Set<string>(Object.values(Priority));

function safeDatabaseId(value: string | undefined): DatabaseId | undefined {
  if (value && DatabaseId.isValid(value)) return new DatabaseId(value);
  return undefined;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectPgModel(Task.name) private taskModel: Model<Task>,
    private auditLogService: AuditLogService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: Partial<Task>, userId: string) {
    const payload = this.normalizeDependencyFields(dto);
    const task = await this.taskModel.create(payload);
    await this.syncDependencyStates(task.projectId.toString());

    await this.auditLogService.log({
      action: 'create',
      entityType: 'Task',
      entityId: task._id,
      performedBy: userId,
      projectId: payload.projectId,
      newValues: payload,
    });

    if (payload.ownerId && payload.ownerId.toString() !== userId) {
      await this.notificationsService.create({
        userId: payload.ownerId,
        title: 'Task Assigned',
        message: `You have been assigned: ${task.title}`,
        type: NotificationType.ASSIGNMENT,
        projectId: payload.projectId,
        taskId: task._id,
        link: `/projects/${payload.projectId}/tasks/${task._id}`,
      });
    }

    return task;
  }

  async findAll(query: {
    projectId?: string;
    status?: string;
    ownerId?: string;
    departmentId?: string;
    priority?: string;
  }) {
    const filter: any = { deletedAt: null };

    // Whitelist enum values to prevent NoSQL operator injection
    if (query.status && VALID_STATUSES.has(query.status)) {
      filter.status = query.status;
    }
    if (query.priority && VALID_PRIORITIES.has(query.priority)) {
      filter.priority = query.priority;
    }

    // Validate UUID fields before querying
    const projectId = safeDatabaseId(query.projectId);
    if (projectId) filter.projectId = projectId;

    const ownerId = safeDatabaseId(query.ownerId);
    if (ownerId) filter.ownerId = ownerId;

    const departmentId = safeDatabaseId(query.departmentId);
    if (departmentId) filter.departmentId = departmentId;

    return this.taskModel
      .find(filter)
      .populate('ownerId', 'firstName lastName')
      .populate('departmentId', 'name')
      .populate('dependsOn', 'title status')
      .populate('dependsOnTaskId', 'title status')
      .sort({ dueDate: 1 })
      .exec();
  }

  async findById(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Task not found');
    const task = await this.taskModel
      .findOne({ _id: id, deletedAt: null })
      .populate('ownerId', 'firstName lastName email')
      .populate('departmentId', 'name')
      .populate('dependsOn', 'title status')
      .populate('dependsOnTaskId', 'title status');
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: Partial<Task>, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Task not found');
    const existing = await this.taskModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Task not found');

    const previousValues = existing.toObject();
    const payload = this.normalizeDependencyFields({ ...previousValues, ...dto });

    if (payload.status === TaskStatus.CLOSED || payload.status === TaskStatus.RELEASED) {
      payload.completedDate = new Date() as any;
    }

    const updated = await this.taskModel.findByIdAndUpdate(id, { $set: payload }, { new: true });
    await this.syncDependencyStates(existing.projectId.toString());

    await this.auditLogService.log({
      action: 'update',
      entityType: 'Task',
      entityId: id,
      performedBy: userId,
      projectId: existing.projectId,
      previousValues,
      newValues: payload,
    });

    if (payload.status && payload.status !== previousValues.status) {
      await this.notificationsService.create({
        userId: existing.ownerId,
        title: 'Task Status Changed',
        message: `Task "${existing.title}" status changed to ${payload.status}`,
        type: NotificationType.STATUS_CHANGE,
        projectId: existing.projectId,
        taskId: new DatabaseId(id),
        link: `/projects/${existing.projectId}/tasks/${id}`,
      });
    }

    return updated;
  }

  async softDelete(id: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Task not found');
    const task = await this.taskModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!task) throw new NotFoundException('Task not found');

    await this.auditLogService.log({
      action: 'delete',
      entityType: 'Task',
      entityId: id,
      performedBy: userId,
      projectId: task.projectId,
    });

    return { message: 'Task deleted' };
  }

  async getOverdueTasks(projectId?: string) {
    const filter: any = {
      deletedAt: null,
      dueDate: { $lt: new Date() },
      status: { $nin: [TaskStatus.CLOSED, TaskStatus.RELEASED] },
    };
    const pid = safeDatabaseId(projectId);
    if (pid) filter.projectId = pid;
    return this.taskModel
      .find(filter)
      .populate('ownerId', 'firstName lastName')
      .populate('departmentId', 'name')
      .exec();
  }

  async getBlockedTasks(projectId?: string) {
    const filter: any = { deletedAt: null, status: TaskStatus.BLOCKED };
    const pid = safeDatabaseId(projectId);
    if (pid) filter.projectId = pid;
    return this.taskModel
      .find(filter)
      .populate('ownerId', 'firstName lastName')
      .populate('departmentId', 'name')
      .exec();
  }

  private normalizeDependencyFields(dto: Partial<Task>) {
    const dependsOnTaskId = dto.dependsOnTaskId || dto.dependsOn?.[0] || null;
    const dependsOn = dependsOnTaskId ? [dependsOnTaskId] : [];
    return {
      ...dto,
      dependsOnTaskId,
      dependsOn,
    };
  }

  private async syncDependencyStates(projectId: string) {
    if (!DatabaseId.isValid(projectId)) return;
    const tasks = await this.taskModel.find({ projectId: new DatabaseId(projectId), deletedAt: null }).lean();
    const taskMap = new Map(tasks.map((task: any) => [task._id.toString(), task]));

    for (const task of tasks) {
      const dependencyId = task.dependsOnTaskId?.toString?.() || task.dependsOn?.[0]?.toString?.();
      if (!dependencyId) {
        if (task.dependencyBlocked) {
          await this.taskModel.findByIdAndUpdate(task._id, { $set: { dependencyBlocked: false } });
        }
        continue;
      }

      const dependency = taskMap.get(dependencyId);
      const dependencyComplete = dependency && [TaskStatus.CLOSED, TaskStatus.RELEASED].includes(dependency.status);

      if (!dependencyComplete) {
        await this.taskModel.findByIdAndUpdate(task._id, {
          $set: {
            dependsOnTaskId: dependencyId,
            dependsOn: [dependencyId],
            dependencyBlocked: true,
            status: TaskStatus.BLOCKED,
            blockerReason: task.blockerReason || `Waiting on ${dependency?.title || 'dependency task'}`,
          },
        });
        continue;
      }

      if (task.dependencyBlocked && task.status === TaskStatus.BLOCKED) {
        await this.taskModel.findByIdAndUpdate(task._id, {
          $set: {
            dependencyBlocked: false,
            blockerReason: task.blockerReason?.startsWith('Waiting on ') ? '' : task.blockerReason,
            status: TaskStatus.NOT_STARTED,
          },
        });
      } else if (task.dependencyBlocked) {
        await this.taskModel.findByIdAndUpdate(task._id, {
          $set: { dependencyBlocked: false },
        });
      }
    }
  }
}
