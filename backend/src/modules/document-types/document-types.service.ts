import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { NumberResetFrequency } from '../../schemas/document-type.schema';
import { DocumentTypeEntity } from '../../database/entities/release1.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from './document-types.dto';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectRepository(DocumentTypeEntity) private documentTypes: Repository<DocumentTypeEntity>,
    private auditLogService: AuditLogService,
    private dataSource: DataSource,
  ) {}

  findAll() { return this.documentTypes.find({ where: { deletedAt: IsNull() }, order: { name: 'ASC' } }); }

  async create(dto: CreateDocumentTypeDto, userId: string) {
    if (await this.documentTypes.exists({ where: { code: dto.code, deletedAt: IsNull() } })) throw new BadRequestException('Document type code already exists');
    const documentType = await this.documentTypes.save(this.documentTypes.create({ ...dto, nextNumber: String(dto.nextNumber ?? 1), lastPeriod: this.period(dto.resetFrequency || NumberResetFrequency.YEARLY) }));
    await this.auditLogService.log({ action: 'create', entityType: 'DocumentType', entityId: documentType._id, performedBy: userId, newValues: dto });
    return documentType;
  }

  async update(id: string, dto: UpdateDocumentTypeDto, userId: string) {
    if (!isUUID(id)) throw new NotFoundException('Document type not found');
    const existing = await this.documentTypes.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!existing) throw new NotFoundException('Document type not found');
    const changes: Record<string, unknown> = { ...dto };
    if (dto.resetFrequency && dto.resetFrequency !== existing.resetFrequency) changes.lastPeriod = this.period(dto.resetFrequency);
    const documentType = await this.documentTypes.save(this.documentTypes.merge(existing, { ...changes, nextNumber: dto.nextNumber === undefined ? existing.nextNumber : String(dto.nextNumber) }));
    await this.auditLogService.log({ action: 'update', entityType: 'DocumentType', entityId: id, performedBy: userId, previousValues: { ...existing }, newValues: changes });
    return documentType;
  }

  async remove(id: string, userId: string) {
    if (!isUUID(id)) throw new NotFoundException('Document type not found');
    const documentType = await this.documentTypes.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!documentType) throw new NotFoundException('Document type not found');
    documentType.isActive = false;
    await this.documentTypes.save(documentType);
    await this.documentTypes.softDelete(id);
    await this.auditLogService.log({ action: 'delete', entityType: 'DocumentType', entityId: id, performedBy: userId, previousValues: { ...documentType } });
    return { message: 'Document type deleted' };
  }

  async generate(code: string, date = new Date()) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(DocumentTypeEntity);
      const current = await repository.findOne({ where: { code, isActive: true, deletedAt: IsNull() }, lock: { mode: 'pessimistic_write' } });
      if (!current) throw new NotFoundException(`Document type ${code} is not configured`);
      const currentPeriod = this.period(current.resetFrequency, date);
      if (current.lastPeriod !== currentPeriod) { current.nextNumber = '1'; current.lastPeriod = currentPeriod; }
      const claimedNumber = Number(current.nextNumber);
      current.nextNumber = String(claimedNumber + 1);
      await repository.save(current);
      return [current.prefix, ...(currentPeriod ? [currentPeriod] : []), String(claimedNumber).padStart(current.padding, '0')].join('-');
    });
  }

  private period(frequency: NumberResetFrequency, date = new Date()) {
    if (frequency === NumberResetFrequency.NEVER) return '';
    const year = String(date.getUTCFullYear());
    return frequency === NumberResetFrequency.MONTHLY ? `${year}${String(date.getUTCMonth() + 1).padStart(2, '0')}` : year;
  }
}
