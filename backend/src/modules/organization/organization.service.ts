import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Branch, Company, Location } from '../../schemas/organization.schema';
import { COMPANY_OPTIONAL_FIELDS, CreateBranchDto, CreateLocationDto, UpdateBranchDto, UpdateCompanyDto, UpdateLocationDto } from './organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectPgModel(Company.name) private companyModel: Model<Company>,
    @InjectPgModel(Branch.name) private branchModel: Model<Branch>,
    @InjectPgModel(Location.name) private locationModel: Model<Location>,
    private auditLogService: AuditLogService,
  ) {}

  getCompany() {
    return this.companyModel.findOne({ deletedAt: null }).exec();
  }

  async upsertCompany(dto: UpdateCompanyDto, userId: string) {
    const existing = await this.companyModel.findOne({ deletedAt: null });
    const duplicate = await this.companyModel.exists({ code: dto.code, deletedAt: null, ...(existing ? { _id: { $ne: existing._id } } : {}) });
    if (duplicate) throw new ConflictException('Company code already exists');
    const values = this.clearedOptionalFields(dto);
    const company = existing
      ? await this.companyModel.findByIdAndUpdate(existing._id, { $set: values }, { new: true })
      : await this.companyModel.create(values);
    await this.auditLogService.log({
      action: existing ? 'update' : 'create', entityType: 'Company', entityId: company!._id, performedBy: userId,
      previousValues: existing?.toObject(), newValues: values,
    });
    return company;
  }

  /**
   * The profile form always submits every field, so an optional field arriving
   * blank means "clear it". Without an explicit null the update would skip the
   * column and the stale value would survive.
   */
  private clearedOptionalFields(dto: UpdateCompanyDto): Record<string, unknown> {
    const values: Record<string, unknown> = { ...dto };
    for (const field of COMPANY_OPTIONAL_FIELDS) {
      if (values[field] === undefined) values[field] = null;
    }
    return values;
  }

  async createBranch(dto: CreateBranchDto, userId: string) {
    await this.requireDocument(this.companyModel, dto.companyId, 'Company');
    await this.assertCodeAvailable(this.branchModel, dto.code, 'Branch');
    const branch = await this.branchModel.create(dto);
    await this.logCreate('Branch', branch, userId);
    return branch.populate('companyId', 'code name');
  }

  findBranches(search?: string) {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (search?.trim()) {
      const expression = { $regex: search.trim(), $options: 'i' };
      filter.$or = [{ code: expression }, { name: expression }, { city: expression }];
    }
    return this.branchModel.find(filter).populate('companyId', 'code name').sort({ code: 1 }).exec();
  }

  async updateBranch(id: string, dto: UpdateBranchDto, userId: string) {
    const existing = await this.requireDocument(this.branchModel, id, 'Branch');
    const branch = await this.branchModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.logUpdate('Branch', id, existing, dto, userId);
    return branch;
  }

  async deleteBranch(id: string, userId: string) {
    const existing = await this.requireDocument(this.branchModel, id, 'Branch');
    if (await this.locationModel.exists({ branchId: id, deletedAt: null })) throw new ConflictException('Branch has active locations');
    await this.branchModel.updateOne({ _id: id }, { $set: { deletedAt: new Date(), isActive: false } });
    await this.logDelete('Branch', id, existing, userId);
    return { message: 'Branch deleted' };
  }

  async createLocation(dto: CreateLocationDto, userId: string) {
    await this.requireDocument(this.branchModel, dto.branchId, 'Branch');
    await this.assertCodeAvailable(this.locationModel, dto.code, 'Location');
    const location = await this.locationModel.create(dto);
    await this.logCreate('Location', location, userId);
    return location.populate('branchId', 'code name');
  }

  findLocations(query: { search?: string; branchId?: string }) {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (query.search?.trim()) {
      const expression = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [{ code: expression }, { name: expression }, { city: expression }];
    }
    if (query.branchId && DatabaseId.isValid(query.branchId)) filter.branchId = query.branchId;
    return this.locationModel.find(filter).populate('branchId', 'code name').sort({ code: 1 }).exec();
  }

  async updateLocation(id: string, dto: UpdateLocationDto, userId: string) {
    const existing = await this.requireDocument(this.locationModel, id, 'Location');
    if (dto.branchId) await this.requireDocument(this.branchModel, dto.branchId, 'Branch');
    const location = await this.locationModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.logUpdate('Location', id, existing, dto, userId);
    return location;
  }

  async deleteLocation(id: string, userId: string) {
    const existing = await this.requireDocument(this.locationModel, id, 'Location');
    await this.locationModel.updateOne({ _id: id }, { $set: { deletedAt: new Date(), isActive: false } });
    await this.logDelete('Location', id, existing, userId);
    return { message: 'Location deleted' };
  }

  private async assertCodeAvailable(model: Model<any>, code: string, label: string) {
    if (await model.exists({ code, deletedAt: null })) throw new ConflictException(`${label} code already exists`);
  }

  private async requireDocument(model: Model<any>, id: string, label: string): Promise<any> {
    if (!DatabaseId.isValid(id)) throw new NotFoundException(`${label} not found`);
    const document = await model.findOne({ _id: id, deletedAt: null, isActive: true });
    if (!document) throw new NotFoundException(`${label} not found`);
    return document;
  }

  private async logCreate(entityType: string, document: any, userId: string) {
    await this.auditLogService.log({ action: 'create', entityType, entityId: document._id, performedBy: userId, newValues: document.toObject() });
  }

  private async logUpdate(entityType: string, entityId: string, existing: any, dto: object, userId: string) {
    await this.auditLogService.log({ action: 'update', entityType, entityId, performedBy: userId, previousValues: existing.toObject(), newValues: dto });
  }

  private async logDelete(entityType: string, entityId: string, existing: any, userId: string) {
    await this.auditLogService.log({ action: 'delete', entityType, entityId, performedBy: userId, previousValues: existing.toObject() });
  }
}