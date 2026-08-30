import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { DiscussionEntry } from '../../schemas/discussion.schema';
import { CreateDiscussionEntryDto } from './discussion.dto';
import { UpdateDiscussionEntryDto } from './discussion.dto';

@Injectable()
export class DiscussionService {
  constructor(
    @InjectPgModel(DiscussionEntry.name) private entryModel: Model<DiscussionEntry>,
  ) {}

  async create(opportunityId: string, authorId: string, dto: CreateDiscussionEntryDto): Promise<DiscussionEntry> {
    const entry = await this.entryModel.create({
      ...dto,
      opportunityId: new DatabaseId(opportunityId),
      authorId: new DatabaseId(authorId),
      participants: (dto.participants ?? []).map((id) => new DatabaseId(id)),
      date: new Date(dto.date),
    });
    return this.entryModel
      .findById(entry._id)
      .populate('authorId', 'firstName lastName')
      .populate('participants', 'firstName lastName')
      .exec() as Promise<DiscussionEntry>;
  }

  async findAll(opportunityId: string, openQuestionsOnly?: boolean): Promise<DiscussionEntry[]> {
    const filter: Record<string, unknown> = {
      opportunityId: new DatabaseId(opportunityId),
      deletedAt: null,
    };
    if (openQuestionsOnly) {
      filter.isOpenQuestion = true;
      filter.resolvedAt = null;
    }
    return this.entryModel
      .find(filter)
      .populate('authorId', 'firstName lastName')
      .populate('participants', 'firstName lastName')
      .sort({ isPinned: -1, date: -1 })
      .exec();
  }

  async update(id: string, requesterId: string, dto: UpdateDiscussionEntryDto): Promise<DiscussionEntry> {
    const entry = await this.entryModel.findById(id);
    if (!entry || entry.deletedAt) throw new NotFoundException('Discussion entry not found');
    if (entry.authorId.toHexString() !== requesterId) throw new ForbiddenException('Not the author');

    const updates: Record<string, unknown> = { ...dto };

    if (dto.isOpenQuestion === false && entry.isOpenQuestion) {
      updates.resolvedAt = new Date();
      if (dto.resolvedBy) updates.resolvedBy = new DatabaseId(dto.resolvedBy);
    }

    return this.entryModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('authorId', 'firstName lastName')
      .populate('participants', 'firstName lastName')
      .exec() as Promise<DiscussionEntry>;
  }

  async remove(id: string, requesterId: string): Promise<{ message: string }> {
    const entry = await this.entryModel.findById(id);
    if (!entry || entry.deletedAt) throw new NotFoundException('Discussion entry not found');
    if (entry.authorId.toHexString() !== requesterId) throw new ForbiddenException('Not the author');

    await this.entryModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { message: 'Entry deleted' };
  }
}
