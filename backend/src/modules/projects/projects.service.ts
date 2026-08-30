import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Project } from '../../schemas/project.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectPgModel(Project.name) private projectModel: Model<Project>,
    private auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateProjectDto, userId: string) {
    const projectNo = await this.generateProjectNo();
    const project = await this.projectModel.create({ ...dto, projectNo });

    await this.auditLogService.log({
      action: 'create',
      entityType: 'Project',
      entityId: project._id,
      performedBy: userId,
      projectId: project._id,
      newValues: { ...dto, projectNo },
    });

    return project;
  }

  async findAll(query: { stage?: string; health?: string; projectManagerId?: string; customerId?: string }) {
    const filter: any = { deletedAt: null };
    if (query.stage) filter.stage = query.stage;
    if (query.health) filter.health = query.health;
    if (query.projectManagerId) filter.projectManagerId = query.projectManagerId;
    if (query.customerId && DatabaseId.isValid(query.customerId)) filter.customerId = query.customerId;
    return this.projectModel.find(filter).populate('customerId', 'name').populate('projectManagerId', 'firstName lastName').sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Project not found');
    const project = await this.projectModel.findOne({ _id: id, deletedAt: null }).populate('customerId').populate('projectManagerId', 'firstName lastName email').populate('teamMembers', 'firstName lastName email role').populate({ path: 'kickoff.attendees', select: 'firstName lastName email' }).populate('opportunityId', 'title requestNo status feasibilityRating feasibilityNotes complexityRating complexityNotes riskRating riskNotes budgetAlignment');
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Project not found');
    const existing = await this.projectModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Project not found');

    const previousValues = existing.toObject();
    const updated = await this.projectModel.findByIdAndUpdate(id, { $set: dto }, { new: true });

    await this.auditLogService.log({
      action: 'update',
      entityType: 'Project',
      entityId: id,
      performedBy: userId,
      projectId: id,
      previousValues,
      newValues: dto,
    });

    return updated;
  }

  async updateKickoff(id: string, kickoffData: any, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Project not found');
    const project = await this.projectModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { kickoff: kickoffData } }, { new: true });
    if (!project) throw new NotFoundException('Project not found');

    await this.auditLogService.log({
      action: 'kickoff_update',
      entityType: 'Project',
      entityId: id,
      performedBy: userId,
      projectId: id,
      newValues: kickoffData,
    });

    return project;
  }

  async addMilestone(id: string, milestone: any, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Project not found');
    const project = await this.projectModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $push: { milestones: milestone } }, { new: true });
    if (!project) throw new NotFoundException('Project not found');

    await this.auditLogService.log({
      action: 'add_milestone',
      entityType: 'Project',
      entityId: id,
      performedBy: userId,
      projectId: id,
      newValues: milestone,
    });

    return project;
  }

  private async generateProjectNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PRJ-${year}-`;
    const last = await this.projectModel
      .findOne({ projectNo: new RegExp(`^${prefix}`) })
      .sort({ projectNo: -1 })
      .select('projectNo')
      .lean<{ projectNo: string }>();
    const seq = last?.projectNo ? parseInt(last.projectNo.slice(prefix.length), 10) || 0 : 0;
    return `${prefix}${String(seq + 1).padStart(4, '0')}`;
  }

  async softDelete(id: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Project not found');
    const project = await this.projectModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!project) throw new NotFoundException('Project not found');

    await this.auditLogService.log({
      action: 'delete',
      entityType: 'Project',
      entityId: id,
      performedBy: userId,
      projectId: id,
    });

    return { message: 'Project deleted' };
  }
}
