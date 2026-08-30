import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { ProcurementItem, Supplier } from '../../schemas/procurement.schema';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectPgModel(ProcurementItem.name) private procurementItemModel: Model<ProcurementItem>,
    @InjectPgModel(Supplier.name) private supplierModel: Model<Supplier>,
    private auditLogService: AuditLogService,
  ) {}

  // --- Procurement Items ---
  async createItem(dto: Partial<ProcurementItem>, userId: string) {
    const item = await this.procurementItemModel.create(dto);
    await this.auditLogService.log({
      action: 'create',
      entityType: 'ProcurementItem',
      entityId: item._id,
      performedBy: userId,
      projectId: dto.projectId,
      newValues: dto,
    });
    return item;
  }

  async findAllItems(query: { projectId?: string; status?: string; isLongLead?: string }) {
    const filter: any = { deletedAt: null };
    if (query.projectId) filter.projectId = query.projectId;
    if (query.status) filter.status = query.status;
    if (query.isLongLead === 'true') filter.isLongLead = true;
    return this.procurementItemModel.find(filter).populate('supplierId', 'name').populate('deliverableId', 'title').sort({ createdAt: -1 }).exec();
  }

  async updateItem(id: string, dto: Partial<ProcurementItem>, userId: string) {
    const existing = await this.procurementItemModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Procurement item not found');

    const updated = await this.procurementItemModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.auditLogService.log({
      action: 'update',
      entityType: 'ProcurementItem',
      entityId: id,
      performedBy: userId,
      projectId: existing.projectId,
      previousValues: existing.toObject(),
      newValues: dto,
    });
    return updated;
  }

  // --- Suppliers ---
  async createSupplier(dto: Partial<Supplier>) {
    return this.supplierModel.create(dto);
  }

  async findAllSuppliers() {
    return this.supplierModel.find({ deletedAt: null }).exec();
  }

  async updateSupplier(id: string, dto: Partial<Supplier>) {
    const supplier = await this.supplierModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: dto }, { new: true });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }
}
