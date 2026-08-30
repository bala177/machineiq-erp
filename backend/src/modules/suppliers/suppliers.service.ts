import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Supplier } from '../../schemas/procurement.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SequencesService } from '../sequences/sequences.service';
import { CreateSupplierDto, UpdateSupplierDto } from './suppliers.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectPgModel(Supplier.name) private supplierModel: Model<Supplier>,
    private sequencesService: SequencesService,
    private auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateSupplierDto, userId: string) {
    await this.assertNameAvailable(dto.name);
    const value = await this.sequencesService.next('supplier');
    const supplier = await this.supplierModel.create({ ...dto, code: `SUP-${String(value).padStart(5, '0')}` });
    await this.auditLogService.log({ action: 'create', entityType: 'Supplier', entityId: supplier._id, performedBy: userId, newValues: dto });
    return supplier;
  }

  findAll(query: { search?: string; qualificationStatus?: string }) {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (query.qualificationStatus) filter.qualificationStatus = query.qualificationStatus;
    if (query.search) {
      const expression = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [{ code: expression }, { name: expression }, { contactPerson: expression }, { category: expression }];
    }
    return this.supplierModel.find(filter).sort({ code: 1 }).exec();
  }

  async update(id: string, dto: UpdateSupplierDto, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Supplier not found');
    const existing = await this.supplierModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Supplier not found');
    if (dto.name) await this.assertNameAvailable(dto.name, id);
    const supplier = await this.supplierModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.auditLogService.log({ action: 'update', entityType: 'Supplier', entityId: id, performedBy: userId, previousValues: existing.toObject(), newValues: dto });
    return supplier;
  }

  async softDelete(id: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Supplier not found');
    const supplier = await this.supplierModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date(), isActive: false } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    await this.auditLogService.log({ action: 'delete', entityType: 'Supplier', entityId: id, performedBy: userId, previousValues: supplier.toObject() });
    return { message: 'Supplier deleted' };
  }

  private async assertNameAvailable(name: string, excludeId?: string) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const supplier = await this.supplierModel.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' }, deletedAt: null, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (supplier) throw new BadRequestException('A supplier with this name already exists');
  }
}
