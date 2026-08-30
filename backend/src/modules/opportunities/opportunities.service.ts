import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Opportunity } from '../../schemas/opportunity.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Customer } from '../../schemas/customer.schema';
import { User } from '../../schemas/user.schema';
import { Project } from '../../schemas/project.schema';
import { Quote } from '../../schemas/quote.schema';
import { OpportunityIntakeMode, OpportunityStatus, ProjectHealth, ProjectStage, Role } from '../../common/enums';
import { MachineTemplatesService } from '../machine-templates/machine-templates.service';
import { ConvertOpportunityDto, CreateOpportunityDto, CreateOpportunityFromTemplateDto, ReferencePhotoDto, UpdateOpportunityIntakeDto, UpdateOpportunityReviewDto, UpdateOpportunityStatusDto } from './opportunities.dto';
import { SequencesService } from '../sequences/sequences.service';

type CurrentUser = { userId: string; role: string };

const PM_ROLES = new Set<string>([Role.ADMIN, Role.MANAGER]);
// Continuous evolution: intake fields stay editable in every status except hard-final ones.
const INTAKE_LOCKED_STATUSES = new Set<OpportunityStatus>([OpportunityStatus.CONVERTED_TO_PROJECT]);
const REVIEW_EDITABLE_STATUSES = new Set<OpportunityStatus>([
  OpportunityStatus.DRAFT,
  OpportunityStatus.NEW,
  OpportunityStatus.UNDER_REVIEW,
  OpportunityStatus.FEASIBILITY_IN_PROGRESS,
]);
const ALLOWED_TRANSITIONS: Record<OpportunityStatus, OpportunityStatus[]> = {
  [OpportunityStatus.DRAFT]: [OpportunityStatus.NEW],
  [OpportunityStatus.NEW]: [OpportunityStatus.UNDER_REVIEW, OpportunityStatus.DRAFT],
  [OpportunityStatus.UNDER_REVIEW]: [OpportunityStatus.FEASIBILITY_IN_PROGRESS],
  [OpportunityStatus.FEASIBILITY_IN_PROGRESS]: [OpportunityStatus.APPROVED, OpportunityStatus.REJECTED],
  [OpportunityStatus.APPROVED]: [OpportunityStatus.CONVERTED_TO_PROJECT],
  [OpportunityStatus.REJECTED]: [OpportunityStatus.UNDER_REVIEW],
  [OpportunityStatus.CONVERTED_TO_PROJECT]: [],
};

// Fields used by the completeness meter (must mirror the most useful intake inputs).
const COMPLETENESS_FIELDS = ['title', 'customerId', 'machineType', 'productApplication', 'processSummary', 'throughputTarget', 'deliveryTargetDate', 'controlPlatform', 'safetyLevel', 'complianceRegion', 'environment', 'budgetRange'];

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectPgModel(Opportunity.name) private opportunityModel: Model<Opportunity>,
    @InjectPgModel(Customer.name) private customerModel: Model<Customer>,
    @InjectPgModel(User.name) private userModel: Model<User>,
    @InjectPgModel(Project.name) private projectModel: Model<Project>,
    @InjectPgModel(Quote.name) private quoteModel: Model<Quote>,
    private auditLogService: AuditLogService,
    private templatesService: MachineTemplatesService,
    private sequencesService: SequencesService,
  ) {}

  async create(dto: CreateOpportunityDto, userId: string) {
    await this.assertCustomerExists(dto.customerId);
    const template = dto.templateId ? await this.templatesService.findById(dto.templateId) : null;
    const requestNo = await this.generateRequestNo();
    const opportunity = await this.opportunityModel.create({
      ...dto,
      checklistResponses: dto.checklistResponses?.length ? dto.checklistResponses : (template?.checklist || []).map((item: any) => ({ label: item.label, response: '' })),
      requestNo,
      status: OpportunityStatus.DRAFT,
      intakeMode: dto.templateId ? OpportunityIntakeMode.TEMPLATE : OpportunityIntakeMode.BLANK,
      templateId: dto.templateId || null,
      createdBy: userId,
      deliveryTargetDate: dto.deliveryTargetDate ? new Date(dto.deliveryTargetDate) : undefined,
    });
    if (dto.templateId) {
      await this.templatesService.incrementUsage(dto.templateId);
    }
    await this.auditLogService.log({
      action: 'create',
      entityType: 'Opportunity',
      entityId: opportunity._id,
      performedBy: userId,
      newValues: { ...dto, requestNo },
    });
    return this.findById(String(opportunity._id));
  }

  async createFromTemplate(templateId: string, dto: CreateOpportunityFromTemplateDto, userId: string) {
    const template = await this.templatesService.findById(templateId);
    await this.assertCustomerExists(dto.customerId);
    const customer = await this.customerModel.findById(dto.customerId).select('name');
    const defaults = (template.defaults || {}) as Record<string, unknown>;
    const requestNo = await this.generateRequestNo();
    const created = await this.opportunityModel.create({
      ...defaults,
      title: dto.title || `${template.name} for ${customer?.name || 'Customer'}`,
      customerId: dto.customerId,
      endCustomer: dto.endCustomer,
      requestNo,
      status: OpportunityStatus.DRAFT,
      intakeMode: OpportunityIntakeMode.TEMPLATE,
      templateId: template._id,
      checklistResponses: (template.checklist || []).map((item: any) => ({
        label: item.label,
        response: '',
      })),
      createdBy: userId,
    });
    await this.templatesService.incrementUsage(templateId);
    await this.auditLogService.log({
      action: 'create_from_template',
      entityType: 'Opportunity',
      entityId: created._id,
      performedBy: userId,
      newValues: { templateId, requestNo },
    });
    return this.findById(String(created._id));
  }

  async createWithCustomer(
    dto: {
      customerId?: string;
      newCustomer?: { name: string; industry?: string; contactPerson?: string; email?: string; phone?: string; country?: string };
      endCustomer?: string;
      title?: string;
      templateId?: string;
      machineVertical?: string;
      machineCategory?: string;
      machineType?: string;
      deliveryTargetDate?: string;
      targetOutput?: string;
      criticalSpec?: string;
      componentMaterial?: string;
      sizeRange?: string;
      checklistResponses?: { label: string; response?: string }[];
    },
    userId: string,
  ) {
    let customerId = dto.customerId;
    if (!customerId) {
      if (!dto.newCustomer?.name) {
        throw new BadRequestException('Provide either customerId or newCustomer.name');
      }
      // Reuse existing customer with the same name (case-insensitive) so we don't duplicate
      const existing = await this.customerModel
        .findOne({
          name: { $regex: `^${dto.newCustomer.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          deletedAt: null,
        })
        .select('_id');
      if (existing) {
        customerId = String(existing._id);
      } else {
        const customerSequence = await this.sequencesService.next('customer');
        const created = await this.customerModel.create({
          code: `CUS-${String(customerSequence).padStart(5, '0')}`,
          name: dto.newCustomer.name.trim(),
          industry: dto.newCustomer.industry,
          contactPerson: dto.newCustomer.contactPerson,
          email: dto.newCustomer.email,
          phone: dto.newCustomer.phone,
          country: dto.newCustomer.country,
        });
        customerId = String(created._id);
        await this.auditLogService.log({
          action: 'create',
          entityType: 'Customer',
          entityId: created._id,
          performedBy: userId,
          newValues: { name: created.name, source: 'opportunity_intake' },
        });
      }
    }

    if (dto.templateId) {
      return this.createFromTemplate(
        dto.templateId,
        {
          customerId: customerId!,
          endCustomer: dto.endCustomer,
          title: dto.title,
        } as any,
        userId,
      );
    }

    return this.create(
      {
        title: dto.title || 'Untitled machine request',
        customerId: customerId!,
        endCustomer: dto.endCustomer,
        machineVertical: dto.machineVertical,
        machineCategory: dto.machineCategory,
        machineType: dto.machineType || dto.machineCategory,
        machinePurpose: dto.machineType || dto.machineCategory,
        deliveryTargetDate: dto.deliveryTargetDate,
        targetOutput: dto.targetOutput,
        criticalSpec: dto.criticalSpec,
        componentMaterial: dto.componentMaterial,
        sizeRange: dto.sizeRange,
        checklistResponses: dto.checklistResponses,
      } as any,
      userId,
    );
  }

  async findAll(query: { status?: string; customerId?: string; createdBy?: string; limit?: string | number; skip?: string | number }) {
    const filter: any = { deletedAt: null };
    if (query.status && Object.values(OpportunityStatus).includes(query.status as OpportunityStatus)) filter.status = query.status;
    if (query.customerId && DatabaseId.isValid(query.customerId)) filter.customerId = query.customerId;
    if (query.createdBy && DatabaseId.isValid(query.createdBy)) filter.createdBy = query.createdBy;
    const requestedLimit = Number(query.limit);
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
    const requestedSkip = Number(query.skip);
    const skip = Number.isInteger(requestedSkip) && requestedSkip >= 0 ? requestedSkip : 0;

    const [opportunities, total] = await Promise.all([this.opportunityModel.find(filter).populate('customerId', 'name').populate('createdBy', 'firstName lastName').populate('assignedReviewer', 'firstName lastName').populate('convertedProjectId', 'projectNo name').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(), this.opportunityModel.countDocuments(filter)]);

    return { data: opportunities, total, limit, skip };
  }

  async findById(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Machine inquiry not found');
    const opp = await this.opportunityModel.findOne({ _id: id, deletedAt: null }).populate('customerId').populate('createdBy', 'firstName lastName email').populate('assignedReviewer', 'firstName lastName email').populate('templateId', 'name category version checklist').populate('convertedProjectId', 'projectNo name');
    if (!opp) throw new NotFoundException('Machine inquiry not found');
    const obj: any = opp.toObject();
    obj.completenessPercent = OpportunitiesService.computeCompleteness(obj);
    return obj;
  }

  async updateIntake(id: string, dto: UpdateOpportunityIntakeDto, currentUser: CurrentUser) {
    const existing = await this.getOpportunityOrThrow(id);
    if (INTAKE_LOCKED_STATUSES.has(existing.status)) {
      throw new BadRequestException('Intake fields cannot be edited after the machine inquiry has been converted to a project');
    }
    if (dto.customerId) {
      await this.assertCustomerExists(dto.customerId);
    }

    return this.updateOpportunity(
      existing,
      {
        ...dto,
        deliveryTargetDate: dto.deliveryTargetDate ? new Date(dto.deliveryTargetDate) : dto.deliveryTargetDate,
      },
      currentUser.userId,
      'intake_update',
    );
  }

  async addPhoto(id: string, dto: ReferencePhotoDto, currentUser: CurrentUser) {
    const existing = await this.getOpportunityOrThrow(id);
    if (INTAKE_LOCKED_STATUSES.has(existing.status)) {
      throw new BadRequestException('Cannot add references after conversion');
    }
    const photo = {
      url: dto.url,
      caption: dto.caption || '',
      kind: dto.kind || 'reference',
      uploadedBy: currentUser.userId,
      uploadedAt: new Date(),
    };
    await this.opportunityModel.updateOne({ _id: existing._id }, { $push: { referencePhotos: photo } });
    await this.auditLogService.log({
      action: 'add_reference',
      entityType: 'Opportunity',
      entityId: existing._id,
      performedBy: currentUser.userId,
      newValues: photo,
    });
    return this.findById(id);
  }

  async removePhoto(id: string, photoUrl: string, currentUser: CurrentUser) {
    const existing = await this.getOpportunityOrThrow(id);
    if (INTAKE_LOCKED_STATUSES.has(existing.status)) {
      throw new BadRequestException('Cannot remove references after conversion');
    }
    const removedPhoto = existing.referencePhotos?.find((photo: any) => photo.url === photoUrl);
    if (!removedPhoto) {
      throw new BadRequestException('Reference photo not found');
    }
    await this.opportunityModel.updateOne({ _id: existing._id }, { $pull: { referencePhotos: { url: photoUrl } } });
    await this.auditLogService.log({
      action: 'remove_reference',
      entityType: 'Opportunity',
      entityId: existing._id,
      performedBy: currentUser.userId,
      newValues: {
        url: removedPhoto.url,
        caption: removedPhoto.caption || '',
        kind: removedPhoto.kind || 'reference',
      },
    });
    return this.findById(id);
  }

  async updateReview(id: string, dto: UpdateOpportunityReviewDto, currentUser: CurrentUser) {
    const existing = await this.getOpportunityOrThrow(id);
    const noteUpdates = [dto.feasibilityNotes, dto.complexityNotes, dto.riskNotes, dto.budgetNotes].some((value) => value !== undefined);
    const reviewerUpdate = dto.assignedReviewer !== undefined;

    if (noteUpdates && !REVIEW_EDITABLE_STATUSES.has(existing.status)) {
      throw new BadRequestException('Review notes can only be edited before approval or conversion');
    }
    if (reviewerUpdate && !PM_ROLES.has(currentUser.role)) {
      throw new ForbiddenException('Only project managers and admins can assign a reviewer');
    }
    if (noteUpdates && !this.canEditReview(existing, currentUser)) {
      throw new ForbiddenException('You do not have permission to edit this review');
    }
    if (dto.assignedReviewer) {
      await this.assertUserExists(dto.assignedReviewer);
    }

    return this.updateOpportunity(existing, dto, currentUser.userId, 'review_update');
  }

  async updateStatus(id: string, dto: UpdateOpportunityStatusDto, currentUser: CurrentUser) {
    const existing = await this.getOpportunityOrThrow(id);
    const nextStatus = dto.status;

    if (!ALLOWED_TRANSITIONS[existing.status as OpportunityStatus]?.includes(nextStatus)) {
      throw new BadRequestException(`Cannot move machine inquiry from ${existing.status} to ${nextStatus}`);
    }
    if (!this.canChangeStatus(existing, currentUser, nextStatus)) {
      throw new ForbiddenException('You do not have permission to perform this status change');
    }
    if (nextStatus === OpportunityStatus.UNDER_REVIEW && !existing.assignedReviewer) {
      throw new BadRequestException('Assign a reviewer before sending the machine inquiry to review');
    }
    if (
      (nextStatus === OpportunityStatus.APPROVED || nextStatus === OpportunityStatus.REJECTED) &&
      !this.hasRequiredReviewData(existing)
    ) {
      const action = nextStatus === OpportunityStatus.APPROVED ? 'approval' : 'rejection';
      throw new BadRequestException(
        `Feasibility, complexity, and risk notes are required before ${action} — record the assessment that led to this decision`,
      );
    }

    const updated = await this.updateOpportunity(existing, { status: nextStatus }, currentUser.userId, 'status_change');

    return updated;
  }

  async convertToProject(id: string, dto: ConvertOpportunityDto, currentUser: CurrentUser) {
    const opportunity = await this.getOpportunityOrThrow(id);
    if (!PM_ROLES.has(currentUser.role)) {
      throw new ForbiddenException('Only project managers and admins can convert machine inquiries');
    }
    if (opportunity.status !== OpportunityStatus.APPROVED) {
      throw new BadRequestException('Only approved machine inquiries can be converted to a project');
    }
    if (opportunity.convertedProjectId) {
      throw new BadRequestException('This machine inquiry has already been converted to a project');
    }
    if (dto.customerId) {
      await this.assertCustomerExists(dto.customerId);
    }
    await this.assertUserExists(dto.projectManagerId);

    const projectNo = await this.generateProjectNo();
    const project = await this.projectModel.create({
      name: dto.name,
      projectNo,
      description: dto.description,
      opportunityId: opportunity._id,
      customerId: dto.customerId || opportunity.customerId,
      projectManagerId: dto.projectManagerId,
      stage: dto.stage || ProjectStage.FEASIBILITY,
      health: dto.health || ProjectHealth.HEALTHY,
      priority: dto.priority || opportunity.priority,
      targetDeliveryDate: dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : opportunity.deliveryTargetDate,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    });

    await this.auditLogService.log({
      action: 'create',
      entityType: 'Project',
      entityId: project._id,
      performedBy: currentUser.userId,
      projectId: project._id,
      newValues: {
        name: project.name,
        opportunityId: opportunity._id,
        customerId: project.customerId,
        projectManagerId: project.projectManagerId,
      },
    });

    const updatedOpportunity = await this.updateOpportunity(
      opportunity,
      {
        status: OpportunityStatus.CONVERTED_TO_PROJECT,
        convertedProjectId: project._id,
      },
      currentUser.userId,
      'convert_to_project',
    );

    return {
      project,
      opportunity: updatedOpportunity,
    };
  }

  async softDelete(id: string, userId: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Machine inquiry not found');
    const opp = await this.opportunityModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!opp) throw new NotFoundException('Machine inquiry not found');

    const quoteUpdate = await this.quoteModel.updateMany({ opportunityId: opp._id, deletedAt: null }, { $set: { opportunityId: null } });

    await this.auditLogService.log({
      action: 'delete',
      entityType: 'Opportunity',
      entityId: id,
      performedBy: userId,
      newValues: { unlinkedQuotes: quoteUpdate.modifiedCount || 0 },
    });

    return { message: 'Machine inquiry deleted' };
  }

  private async getOpportunityOrThrow(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Machine inquiry not found');
    const existing = await this.opportunityModel.findOne({ _id: id, deletedAt: null });
    if (!existing) throw new NotFoundException('Machine inquiry not found');
    return existing;
  }

  private async updateOpportunity(existing: any, updates: Record<string, any>, userId: string, action: string) {
    const previousValues = existing.toObject();
    await this.opportunityModel.updateOne({ _id: existing._id }, { $set: updates });

    await this.auditLogService.log({
      action,
      entityType: 'Opportunity',
      entityId: existing._id,
      performedBy: userId,
      previousValues,
      newValues: updates,
    });

    return this.findById(String(existing._id));
  }

  private canEditReview(existing: any, currentUser: CurrentUser) {
    return PM_ROLES.has(currentUser.role) || String(existing.assignedReviewer || '') === currentUser.userId;
  }

  private canChangeStatus(existing: any, currentUser: CurrentUser, nextStatus: OpportunityStatus) {
    if (nextStatus === OpportunityStatus.NEW) {
      // Submit a draft \u2014 sales (or PM/admin) who own the opportunity can do this
      return currentUser.role === Role.SALES || PM_ROLES.has(currentUser.role);
    }
    if (nextStatus === OpportunityStatus.DRAFT) {
      // Move back to draft to keep editing \u2014 owner or PM
      return currentUser.role === Role.SALES || PM_ROLES.has(currentUser.role);
    }
    if (nextStatus === OpportunityStatus.FEASIBILITY_IN_PROGRESS) {
      return PM_ROLES.has(currentUser.role) || String(existing.assignedReviewer || '') === currentUser.userId;
    }
    return PM_ROLES.has(currentUser.role);
  }

  private hasRequiredReviewData(existing: Opportunity) {
    return Boolean(existing.feasibilityNotes?.trim() && existing.complexityNotes?.trim() && existing.riskNotes?.trim());
  }

  private async assertCustomerExists(customerId: string) {
    if (!DatabaseId.isValid(customerId)) {
      throw new BadRequestException('Customer is invalid');
    }
    const exists = await this.customerModel.exists({ _id: customerId, deletedAt: null });
    if (!exists) {
      throw new BadRequestException('Customer not found');
    }
  }

  private async assertUserExists(userId: string) {
    if (!DatabaseId.isValid(userId)) {
      throw new BadRequestException('User is invalid');
    }
    const exists = await this.userModel.exists({ _id: userId, deletedAt: null, isActive: true });
    if (!exists) {
      throw new BadRequestException('User not found');
    }
  }

  private async generateRequestNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;
    const last = await this.opportunityModel
      .findOne({ requestNo: new RegExp(`^${prefix}`) })
      .sort({ requestNo: -1 })
      .select('requestNo')
      .lean<{ requestNo: string }>();
    const seq = last?.requestNo ? parseInt(last.requestNo.slice(prefix.length), 10) || 0 : 0;
    return `${prefix}${String(seq + 1).padStart(4, '0')}`;
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

  /** Compute % of key intake fields filled — used by the UI completeness meter. */
  static computeCompleteness(opp: Record<string, unknown>): number {
    if (!opp) return 0;
    const filled = COMPLETENESS_FIELDS.filter((field) => {
      const value = opp[field];
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return value > 0;
      return true;
    }).length;
    return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
  }
}
