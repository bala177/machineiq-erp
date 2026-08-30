import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { ProjectDocument } from '../../schemas/document.schema';
import { DecisionLog } from '../../schemas/document.schema';
import { Comment } from '../../schemas/document.schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectPgModel(ProjectDocument.name) private documentModel: Model<ProjectDocument>,
    @InjectPgModel(DecisionLog.name) private decisionLogModel: Model<DecisionLog>,
    @InjectPgModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  // --- Documents ---
  async createDocument(dto: Partial<ProjectDocument>) {
    return this.documentModel.create(dto);
  }

  async findDocuments(projectId?: string) {
    const filter: any = { deletedAt: null };
    if (projectId) filter.projectId = projectId;
    return this.documentModel.find(filter).populate('uploadedBy', 'firstName lastName').sort({ createdAt: -1 }).exec();
  }

  async deleteDocument(id: string) {
    await this.documentModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { message: 'Document deleted' };
  }

  // --- Decision Log ---
  async createDecision(dto: Partial<DecisionLog>) {
    return this.decisionLogModel.create(dto);
  }

  async findDecisions(projectId?: string) {
    const filter: any = { deletedAt: null };
    if (projectId) filter.projectId = projectId;
    return this.decisionLogModel.find(filter).populate('madeBy', 'firstName lastName').populate('participants', 'firstName lastName').sort({ createdAt: -1 }).exec();
  }

  // --- Comments ---
  async createComment(dto: Partial<Comment>) {
    return this.commentModel.create(dto);
  }

  async findComments(query: { taskId?: string; deliverableId?: string; projectId?: string; opportunityId?: string }) {
    const filter: any = {};
    if (query.taskId) filter.taskId = query.taskId;
    if (query.deliverableId) filter.deliverableId = query.deliverableId;
    if (query.projectId) filter.projectId = query.projectId;
    if (query.opportunityId) filter.opportunityId = query.opportunityId;
    return this.commentModel.find(filter).populate('authorId', 'firstName lastName').sort({ createdAt: -1 }).exec();
  }
}
