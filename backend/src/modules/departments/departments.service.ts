import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DepartmentEntity } from '../../database/entities/release1.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity) private departments: Repository<DepartmentEntity>,
    private auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateDepartmentDto, userId: string) {
    await this.assertNameAvailable(dto.name);
    const department = await this.departments.save(this.departments.create(dto));
    await this.auditLogService.log({ action: 'create', entityType: 'Department', entityId: department._id, performedBy: userId, newValues: department });
    return department;
  }

  async findAll() {
    return this.departments.find({ where: { deletedAt: IsNull() }, order: { name: 'ASC' } });
  }

  async findById(id: string) {
    const dept = await this.departments.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, userId: string) {
    const dept = await this.departments.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!dept) throw new NotFoundException('Department not found');
    if (dto.name && dto.name !== dept.name) await this.assertNameAvailable(dto.name, id);
    const previousValues = { ...dept };
    const department = await this.departments.save(this.departments.merge(dept, dto));
    await this.auditLogService.log({ action: 'update', entityType: 'Department', entityId: id, performedBy: userId, previousValues, newValues: department });
    return department;
  }

  async softDelete(id: string, userId: string) {
    const dept = await this.departments.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!dept) throw new NotFoundException('Department not found');
    const assignedUsers = await this.departments.createQueryBuilder('department').innerJoin('department.users', 'user').where('department.id = :id', { id }).andWhere('user.deleted_at IS NULL').getCount();
    if (assignedUsers > 0) throw new ConflictException('Reassign active users before deleting this department');
    const previousValues = { ...dept };
    dept.isActive = false;
    await this.departments.save(dept);
    await this.departments.softDelete(id);
    await this.auditLogService.log({ action: 'delete', entityType: 'Department', entityId: id, performedBy: userId, previousValues });
    return { message: 'Department deleted' };
  }

  private async assertNameAvailable(name: string, excludeId?: string) {
    const query = this.departments.createQueryBuilder('department').where('LOWER(department.name) = LOWER(:name)', { name }).andWhere('department.deleted_at IS NULL');
    if (excludeId) query.andWhere('department.id != :excludeId', { excludeId });
    if (await query.getOne()) throw new ConflictException('A department with this name already exists');
  }
}
