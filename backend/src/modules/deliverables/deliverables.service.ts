import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { Deliverable } from '../../schemas/deliverable.schema';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class DeliverablesService {
  constructor(
    @InjectPgModel(Deliverable.name) private deliverableModel: Model<Deliverable>,
    private auditLogService: AuditLogService,
  ) {}

  async create(dto: Partial<Deliverable>, userId: string) {
    const deliverable = await this.deliverableModel.create(dto);
    await this.auditLogService.log({
      action: 'create',
      entityType: 'Deliverable',
      entityId: deliverable._id,
      performedBy: userId,
      projectId: dto.projectId,
      newValues: dto,
    });
    return deliverable;
  }

  async findAll(query: { projectId?: string; status?: string; procurementStatus?: string; ownerId?: string }) {
    const filter: any = { deletedAt: null };
    if (query.projectId) filter.projectId = query.projectId;
    if (query.status) filter.status = query.status;
    if (query.procurementStatus) filter.procurementStatus = query.procurementStatus;
    if (query.ownerId) filter.ownerId = query.ownerId;
    return this.deliverableModel.find(filter).populate('ownerId', 'firstName lastName').populate('departmentId', 'name').sort({ dueDate: 1 }).exec();
  }

  async findById(id: string) {
    const deliverable = await this.deliverableModel.findOne({ _id: id, deletedAt: null }).populate('ownerId', 'firstName lastName email').populate('departmentId', 'name');
    if (!deliverable) throw new NotFoundException('Deliverable not found');
    return deliverable;
  }

  async update(id: string, dto: Partial<Deliverable>, userId: string) {
    const existing = await this.deliverableModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Deliverable not found');

    const updated = await this.deliverableModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.auditLogService.log({
      action: 'update',
      entityType: 'Deliverable',
      entityId: id,
      performedBy: userId,
      projectId: existing.projectId,
      previousValues: existing.toObject(),
      newValues: dto,
    });
    return updated;
  }

  async softDelete(id: string, userId: string) {
    const deliverable = await this.deliverableModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!deliverable) throw new NotFoundException('Deliverable not found');
    await this.auditLogService.log({
      action: 'delete',
      entityType: 'Deliverable',
      entityId: id,
      performedBy: userId,
      projectId: deliverable.projectId,
    });
    return { message: 'Deliverable deleted' };
  }
}
