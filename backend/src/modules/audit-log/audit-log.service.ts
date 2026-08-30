import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities/release1.entity';

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLogEntity) private auditLogs: Repository<AuditLogEntity>) {}

  async log(data: { action: string; entityType: string; entityId: any; performedBy: any; projectId?: any; previousValues?: any; newValues?: any; ipAddress?: string }) {
    return this.auditLogs.save(this.auditLogs.create(data));
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.auditLogs.find({ where: { entityType, entityId }, relations: { performer: true }, order: { createdAt: 'DESC' } });
  }

  async findByProject(projectId: string, query: { limit?: number } = {}) {
    return this.auditLogs.find({ where: { projectId }, relations: { performer: true }, order: { createdAt: 'DESC' }, take: query.limit || 100 });
  }
}
