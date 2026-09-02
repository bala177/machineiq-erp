import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities/release1.entity';
import { auditRequestContext } from './audit-context';
import { AuditLogQueryDto } from './audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLogEntity) private auditLogs: Repository<AuditLogEntity>) {}

  async log(data: { action: string; entityType: string; entityId: any; performedBy: any; projectId?: any; previousValues?: any; newValues?: any; ipAddress?: string }) {
    const entry = await this.auditLogs.save(this.auditLogs.create(data));
    auditRequestContext.markRecorded();
    return entry;
  }

  async findAll(query: AuditLogQueryDto) {
    const where: FindOptionsWhere<AuditLogEntity> = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.action) {
      const legacyActions: Record<string, string[]> = {
        create: ['create', 'post'],
        update: ['update', 'patch', 'put'],
      };
      where.action = In(legacyActions[query.action] ?? [query.action]);
    }
    if (query.performedBy) where.performedBy = query.performedBy;
    if (query.projectId) where.projectId = query.projectId;
    if (query.from && query.to) where.createdAt = Between(new Date(query.from), new Date(query.to));
    else if (query.from) where.createdAt = MoreThanOrEqual(new Date(query.from));
    else if (query.to) where.createdAt = LessThanOrEqual(new Date(query.to));
    const [items, total] = await this.auditLogs.findAndCount({
      where,
      relations: { performer: true },
      order: { createdAt: query.order },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.auditLogs.find({ where: { entityType, entityId }, relations: { performer: true }, order: { createdAt: 'DESC' } });
  }

  async findByProject(projectId: string, query: { limit?: number } = {}) {
    return this.auditLogs.find({ where: { projectId }, relations: { performer: true }, order: { createdAt: 'DESC' }, take: query.limit || 100 });
  }
}
