import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackEntity } from '../../database/entities/release1.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateFeedbackDto, FeedbackQueryDto, UpdateFeedbackDto } from './feedback.dto';

const CLOSED_STATUSES = new Set(['fixed', 'wont_fix', 'closed']);

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(FeedbackEntity) private readonly feedback: Repository<FeedbackEntity>,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
  ) {}

  isEnabled() {
    return this.config.get<string>('FEEDBACK_ENABLED', 'false').toLowerCase() === 'true';
  }

  private requireEnabled() {
    if (!this.isEnabled()) throw new NotFoundException();
  }

  private screenshot(value?: string) {
    if (!value) return null;
    if (!/^data:image\/(png|jpeg|webp);base64,/i.test(value)) throw new BadRequestException('Screenshot must be a PNG, JPEG, or WebP image');
    const bytes = Math.floor((value.split(',')[1]?.length || 0) * 0.75);
    if (bytes > 2 * 1024 * 1024) throw new BadRequestException('Screenshot must be 2 MB or smaller');
    return value;
  }

  private safeApiError(value?: Record<string, unknown>) {
    if (!value) return null;
    const clean: Record<string, unknown> = {};
    if (typeof value.path === 'string') clean.path = value.path.slice(0, 500).split('?')[0];
    if (typeof value.status === 'number') clean.status = value.status;
    if (typeof value.message === 'string') clean.message = value.message.slice(0, 500);
    if (typeof value.at === 'string') clean.at = value.at.slice(0, 40);
    return Object.keys(clean).length ? clean : null;
  }

  async create(dto: CreateFeedbackDto, userId: string) {
    this.requireEnabled();
    const entity = await this.feedback.save(this.feedback.create({
      ...dto,
      userId,
      status: 'new',
      pagePath: dto.pagePath.split('?')[0].slice(0, 500),
      screenshotDataUrl: this.screenshot(dto.screenshotDataUrl),
      recentApiError: this.safeApiError(dto.recentApiError),
    }));
    await this.audit.log({ action: 'create', entityType: 'feedback', entityId: entity._id, performedBy: userId, newValues: { type: entity.type, urgency: entity.urgency, pagePath: entity.pagePath } });
    return { ...entity, screenshotDataUrl: undefined };
  }

  async mine(userId: string) {
    this.requireEnabled();
    return this.feedback.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async adminList(query: FeedbackQueryDto) {
    this.requireEnabled();
    const qb = this.feedback.createQueryBuilder('feedback')
      .addSelect(['feedback.internalNotes', 'feedback.screenshotDataUrl'])
      .leftJoinAndSelect('feedback.submitter', 'submitter')
      .leftJoinAndSelect('feedback.assignee', 'assignee')
      .orderBy("CASE WHEN feedback.urgency = 'blocking' THEN 0 WHEN feedback.urgency = 'important' THEN 1 ELSE 2 END", 'ASC')
      .addOrderBy('feedback.createdAt', 'DESC');
    if (query.status) qb.andWhere('feedback.status = :status', { status: query.status });
    if (query.type) qb.andWhere('feedback.type = :type', { type: query.type });
    if (query.urgency) qb.andWhere('feedback.urgency = :urgency', { urgency: query.urgency });
    if (query.search) qb.andWhere('(feedback.message ILIKE :search OR feedback.pagePath ILIKE :search)', { search: `%${query.search}%` });
    return qb.take(250).getMany();
  }

  async count() {
    this.requireEnabled();
    const [newCount, blocking] = await Promise.all([
      this.feedback.count({ where: { status: 'new' } }),
      this.feedback.count({ where: { urgency: 'blocking', status: 'new' } }),
    ]);
    return { new: newCount, blocking };
  }

  async update(id: string, dto: UpdateFeedbackDto, userId: string) {
    this.requireEnabled();
    const entity = await this.feedback.createQueryBuilder('feedback').addSelect('feedback.internalNotes').where('feedback.id = :id', { id }).getOne();
    if (!entity) throw new NotFoundException('Feedback not found');
    if (dto.duplicateOfId === id) throw new BadRequestException('Feedback cannot duplicate itself');
    const before = { status: entity.status, assigneeId: entity.assigneeId, targetRelease: entity.targetRelease, customerResponse: entity.customerResponse };
    Object.assign(entity, dto);
    if (dto.status) entity.resolvedAt = CLOSED_STATUSES.has(dto.status) ? (entity.resolvedAt || new Date()) : null;
    const saved = await this.feedback.save(entity);
    await this.audit.log({ action: 'update', entityType: 'feedback', entityId: id, performedBy: userId, previousValues: before, newValues: dto });
    return saved;
  }
}
