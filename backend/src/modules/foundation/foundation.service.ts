import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { CompanyEntity, CurrencyEntity, DepartmentEntity, EmployeeEntity, LocationEntity, ReferenceStatusEntity, TaxRateEntity, UserEntity, WarehouseEntity } from '../../database/entities/release1.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrencyDto, EmployeeDto, ReferenceStatusDto, TaxRateDto, WarehouseDto } from './foundation.dto';

@Injectable()
export class FoundationService {
  constructor(
    @InjectRepository(WarehouseEntity) private warehouses: Repository<WarehouseEntity>,
    @InjectRepository(EmployeeEntity) private employees: Repository<EmployeeEntity>,
    @InjectRepository(CurrencyEntity) private currencies: Repository<CurrencyEntity>,
    @InjectRepository(TaxRateEntity) private taxRates: Repository<TaxRateEntity>,
    @InjectRepository(ReferenceStatusEntity) private statuses: Repository<ReferenceStatusEntity>,
    private db: DataSource,
    private audit: AuditLogService,
  ) {}

  listWarehouses() { return this.warehouses.find({ where: { deletedAt: IsNull() }, relations: { location: true, manager: true }, order: { code: 'ASC' } }); }
  listEmployees() { return this.employees.find({ where: { deletedAt: IsNull() }, relations: { user: true, department: true, manager: true }, order: { employeeCode: 'ASC' } }); }
  listCurrencies() { return this.currencies.find({ where: { deletedAt: IsNull() }, order: { code: 'ASC' } }); }
  listStatuses() { return this.statuses.find({ where: { deletedAt: IsNull() }, order: { module: 'ASC', sortOrder: 'ASC' } }); }
  async listTaxRates() { const company = await this.company(); return this.taxRates.find({ where: { companyId: company._id, deletedAt: IsNull() }, order: { code: 'ASC' } }); }

  async saveWarehouse(dto: WarehouseDto, userId: string, id?: string) {
    await this.active(LocationEntity, dto.locationId, 'Location');
    if (dto.managerId) await this.active(UserEntity, dto.managerId, 'Manager');
    return this.save(this.warehouses, 'Warehouse', dto, userId, id, { code: dto.code });
  }

  async saveEmployee(dto: EmployeeDto, userId: string, id?: string) {
    if (dto.userId) await this.active(UserEntity, dto.userId, 'User');
    if (dto.departmentId) await this.active(DepartmentEntity, dto.departmentId, 'Department');
    if (dto.managerId) {
      if (dto.managerId === id) throw new BadRequestException('An employee cannot manage themselves');
      await this.active(EmployeeEntity, dto.managerId, 'Manager');
    }
    return this.save(this.employees, 'Employee', { ...dto, email: dto.email?.toLowerCase() }, userId, id, { employeeCode: dto.employeeCode });
  }

  saveCurrency(dto: CurrencyDto, userId: string, id?: string) { return this.save(this.currencies, 'Currency', dto, userId, id, { code: dto.code }); }
  async saveTaxRate(dto: TaxRateDto, userId: string, id?: string) {
    if (dto.effectiveFrom && dto.effectiveTo && dto.effectiveTo < dto.effectiveFrom) throw new BadRequestException('Tax end date cannot precede its start date');
    const company = await this.company();
    return this.save(this.taxRates, 'TaxRate', { ...dto, companyId: company._id }, userId, id, { companyId: company._id, code: dto.code });
  }
  saveStatus(dto: ReferenceStatusDto, userId: string, id?: string) { return this.save(this.statuses, 'ReferenceStatus', dto, userId, id, { module: dto.module, code: dto.code }); }

  async remove(kind: 'warehouse' | 'employee' | 'currency' | 'tax-rate' | 'status', id: string, userId: string) {
    const configuration = {
      warehouse: [this.warehouses, 'Warehouse'], employee: [this.employees, 'Employee'], currency: [this.currencies, 'Currency'],
      'tax-rate': [this.taxRates, 'TaxRate'], status: [this.statuses, 'ReferenceStatus'],
    }[kind] as [Repository<any>, string] | undefined;
    if (!configuration) throw new BadRequestException('Invalid foundation record type');
    const existing = await this.find(configuration[0], id, configuration[1]);
    existing.isActive = false;
    await configuration[0].save(existing);
    await configuration[0].softDelete(id);
    await this.audit.log({ action: 'delete', entityType: configuration[1], entityId: id, performedBy: userId, previousValues: existing });
    return { message: `${configuration[1]} deactivated` };
  }

  private async save<T extends { _id: string; deletedAt: Date | null }>(repository: Repository<T>, entityType: string, values: any, userId: string, id?: string, unique?: Record<string, unknown>) {
    const previous = id ? await this.find(repository, id, entityType) : null;
    if (unique && await repository.exists({ where: { ...unique, deletedAt: IsNull(), ...(id ? { _id: Not(id) } : {}) } as any })) throw new ConflictException(`${entityType} code already exists`);
    let saved: T;
    const entity = previous ? repository.merge(previous, values) : repository.create(values as any) as unknown as T;
    try { saved = await repository.save(entity as any) as T; }
    catch (error: any) { if (error?.code === '23505') throw new ConflictException(`${entityType} already exists`); throw error; }
    await this.audit.log({ action: previous ? 'update' : 'create', entityType, entityId: saved._id, performedBy: userId, previousValues: previous || undefined, newValues: values });
    return saved;
  }

  private async find<T extends { _id: string }>(repository: Repository<T>, id: string, label: string): Promise<T> {
    if (!isUUID(id)) throw new NotFoundException(`${label} not found`);
    const record = await repository.findOne({ where: { _id: id, deletedAt: IsNull() } as any });
    if (!record) throw new NotFoundException(`${label} not found`);
    return record;
  }
  private async active(entity: any, id: string, label: string) {
    if (!isUUID(id) || !await this.db.getRepository(entity).exists({ where: { _id: id, isActive: true, deletedAt: IsNull() } })) throw new BadRequestException(`Select an active ${label.toLowerCase()}`);
  }
  private async company() {
    const company = await this.db.getRepository(CompanyEntity).findOne({ where: { isActive: true, deletedAt: IsNull() }, order: { createdAt: 'ASC' } });
    if (!company) throw new BadRequestException('Configure an active company first');
    return company;
  }
}
