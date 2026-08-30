import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { OpportunityStatus, ProjectHealth, ProjectStage, QuoteStatus, Role } from '../../common/enums';
import { Customer } from '../../schemas/customer.schema';
import { Opportunity } from '../../schemas/opportunity.schema';
import { Project } from '../../schemas/project.schema';
import { Quote } from '../../schemas/quote.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SettingsService } from '../settings/settings.service';
import { ConvertQuoteToProjectDto, CreateQuoteDto, QuoteLineItemDto, UpdateQuoteDto, UpdateQuoteStatusDto } from './quotes.dto';
import { DocumentTypesService } from '../document-types/document-types.service';

const EDITABLE_STATUSES = new Set<QuoteStatus>([QuoteStatus.DRAFT]);
const ALLOWED_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.SENT],
  [QuoteStatus.SENT]: [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
  [QuoteStatus.ACCEPTED]: [],
  [QuoteStatus.DECLINED]: [],
  [QuoteStatus.EXPIRED]: [],
};

type QuoteListQuery = {
  customerId?: string;
  opportunityId?: string;
  status?: string;
  search?: string;
  limit?: string | number;
  skip?: string | number;
};

@Injectable()
export class QuotesService {
  constructor(
    @InjectPgModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectPgModel(Customer.name) private customerModel: Model<Customer>,
    @InjectPgModel(Opportunity.name) private opportunityModel: Model<Opportunity>,
    @InjectPgModel(Project.name) private projectModel: Model<Project>,
    private auditLogService: AuditLogService,
    private settingsService: SettingsService,
    private documentTypesService: DocumentTypesService,
  ) {}

  async create(dto: CreateQuoteDto, userId: string) {
    const customer = await this.getCustomerOrThrow(dto.customerId);
    if (dto.opportunityId) {
      await this.assertOpportunityBelongsToCustomer(dto.opportunityId, dto.customerId);
    }

    const preferences = await this.getCommercialPreferences();
    const calculated = QuotesService.calculateTotals(dto.lineItems, dto);
    const quoteNo = await this.documentTypesService.generate('quote');
    const created = await this.quoteModel.create({
      quoteNo,
      customerId: dto.customerId,
      opportunityId: dto.opportunityId || null,
      status: QuoteStatus.DRAFT,
      quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
      validUntil: dto.validUntil ? new Date(dto.validUntil) : this.defaultValidUntil(preferences),
      subject: dto.subject,
      salesPerson: dto.salesPerson,
      currency: (dto.currency || (customer as any).currencyCode || preferences.defaultCurrency || 'INR').trim().toUpperCase(),
      customerSnapshot: this.buildCustomerSnapshot(customer),
      organizationSnapshot: this.buildOrganizationSnapshot(preferences),
      notes: dto.notes ?? preferences.defaultNotes,
      terms: dto.terms ?? preferences.defaultTerms,
      createdBy: userId,
      ...calculated,
    });

    await this.auditLogService.log({
      action: 'create',
      entityType: 'Quote',
      entityId: created._id,
      performedBy: userId,
      newValues: { quoteNo, customerId: dto.customerId, opportunityId: dto.opportunityId || null },
    });

    return this.findById(String(created._id));
  }

  async findAll(query: QuoteListQuery = {}) {
    const filter: any = { deletedAt: null };
    if (query.customerId && DatabaseId.isValid(query.customerId)) filter.customerId = query.customerId;
    if (query.opportunityId && DatabaseId.isValid(query.opportunityId)) filter.opportunityId = query.opportunityId;
    if (query.status && Object.values(QuoteStatus).includes(query.status as QuoteStatus)) filter.status = query.status;
    if (query.search?.trim()) {
      const expression = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [{ quoteNo: expression }, { 'customerSnapshot.name': expression }, { notes: expression }, { terms: expression }];
    }

    const requestedLimit = Number(query.limit);
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
    const requestedSkip = Number(query.skip);
    const skip = Number.isInteger(requestedSkip) && requestedSkip >= 0 ? requestedSkip : 0;

    const [data, total] = await Promise.all([
      this.quoteModel
        .find(filter)
        .populate('customerId', 'name contactPerson email phone')
      .populate('opportunityId', 'requestNo title status')
      .populate('convertedProjectId', 'projectNo name')
      .populate('acceptedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.quoteModel.countDocuments(filter),
    ]);

    return { data, total, limit, skip };
  }

  async findById(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Quote not found');
    const quote = await this.quoteModel
      .findOne({ _id: id, deletedAt: null })
      .populate('customerId', 'name contactPerson email phone')
      .populate('opportunityId', 'requestNo title status')
      .populate('convertedProjectId', 'projectNo name')
      .populate('acceptedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .exec();
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async update(id: string, dto: UpdateQuoteDto, userId: string) {
    const existing = await this.getQuoteOrThrow(id);
    if (!EDITABLE_STATUSES.has(existing.status)) {
      throw new BadRequestException('Only draft quotes can be edited');
    }

    const updates: Record<string, any> = { ...dto };
    if (dto.customerId) {
      const customer = await this.getCustomerOrThrow(dto.customerId);
      updates.customerSnapshot = this.buildCustomerSnapshot(customer);
    }
    if (dto.opportunityId) {
      await this.assertOpportunityBelongsToCustomer(dto.opportunityId, dto.customerId || String(existing.customerId));
    }
    if (dto.opportunityId === '') {
      updates.opportunityId = null;
    }
    if (dto.quoteDate) updates.quoteDate = new Date(dto.quoteDate);
    if (dto.validUntil) updates.validUntil = new Date(dto.validUntil);
    if (dto.currency) updates.currency = dto.currency.trim().toUpperCase();
    if (dto.lineItems || dto.shippingCharge !== undefined || dto.adjustment !== undefined) {
      Object.assign(updates, QuotesService.calculateTotals(dto.lineItems ?? existing.lineItems as any, {
        shippingCharge: dto.shippingCharge ?? existing.shippingCharge,
        adjustment: dto.adjustment ?? existing.adjustment,
      }));
    }

    await this.quoteModel.updateOne({ _id: existing._id }, { $set: updates });
    await this.auditLogService.log({
      action: 'update',
      entityType: 'Quote',
      entityId: existing._id,
      performedBy: userId,
      previousValues: existing.toObject(),
      newValues: updates,
    });

    return this.findById(id);
  }

  async updateStatus(id: string, dto: UpdateQuoteStatusDto, currentUser: { userId: string; role: string }) {
    const existing = await this.getQuoteOrThrow(id);
    const status = dto.status;
    if (existing.status === status) return this.findById(id);
    if (status === QuoteStatus.SENT && ![Role.SALES, Role.ADMIN].includes(currentUser.role as Role)) {
      throw new BadRequestException('Only sales and admin users can send quotes');
    }
    if (!ALLOWED_STATUS_TRANSITIONS[existing.status as QuoteStatus]?.includes(status)) {
      throw new BadRequestException(`Cannot move quote from ${existing.status} to ${status}`);
    }

    const updates: Record<string, any> = { status };
    if (status === QuoteStatus.ACCEPTED) {
      updates.acceptedAt = new Date();
      updates.acceptedBy = currentUser.userId;
      if (dto.customerPoNumber !== undefined) updates.customerPoNumber = dto.customerPoNumber.trim();
    }

    await this.quoteModel.updateOne({ _id: existing._id }, { $set: updates });
    await this.auditLogService.log({
      action: 'status_change',
      entityType: 'Quote',
      entityId: existing._id,
      performedBy: currentUser.userId,
      previousValues: { status: existing.status },
      newValues: updates,
    });
    return this.findById(id);
  }

  async duplicate(id: string, userId: string) {
    const source = await this.getQuoteOrThrow(id);
    const quoteNo = await this.documentTypesService.generate('quote');
    const created = await this.quoteModel.create({
      quoteNo,
      customerId: source.customerId,
      opportunityId: source.opportunityId || null,
      status: QuoteStatus.DRAFT,
      quoteDate: new Date(),
      validUntil: source.validUntil,
      currency: source.currency || 'INR',
      subject: source.subject,
      salesPerson: source.salesPerson,
      customerSnapshot: source.customerSnapshot,
      organizationSnapshot: source.organizationSnapshot,
      lineItems: source.lineItems,
      subtotal: source.subtotal,
      discountTotal: source.discountTotal,
      taxTotal: source.taxTotal,
      shippingCharge: source.shippingCharge,
      adjustment: source.adjustment,
      grandTotal: source.grandTotal,
      notes: source.notes,
      terms: source.terms,
      convertedProjectId: null,
      createdBy: userId,
    });

    await this.auditLogService.log({
      action: 'duplicate',
      entityType: 'Quote',
      entityId: created._id,
      performedBy: userId,
      newValues: { quoteNo, sourceQuoteId: source._id },
    });
    return this.findById(String(created._id));
  }

  async convertToProject(id: string, dto: ConvertQuoteToProjectDto, userId: string) {
    const quote = await this.getQuoteOrThrow(id);
    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Only accepted quotes can be converted to projects');
    }
    if (quote.convertedProjectId) {
      throw new BadRequestException('Quote is already converted to a project');
    }
    if (!DatabaseId.isValid(dto.projectManagerId)) {
      throw new BadRequestException('Project manager is invalid');
    }

    const projectNo = await this.generateProjectNo();
    const project = await this.projectModel.create({
      projectNo,
      name: dto.name,
      description: dto.description || `Project created from quote ${quote.quoteNo}`,
      customerId: quote.customerId,
      opportunityId: quote.opportunityId || undefined,
      sourceQuoteId: quote._id,
      projectManagerId: dto.projectManagerId,
      stage: ProjectStage.FEASIBILITY,
      health: ProjectHealth.HEALTHY,
      targetDeliveryDate: dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      commercialSnapshot: {
        quoteNo: quote.quoteNo,
        currency: quote.currency,
        subtotal: quote.subtotal,
        discountTotal: quote.discountTotal,
        taxTotal: quote.taxTotal,
        shippingCharge: quote.shippingCharge,
        adjustment: quote.adjustment,
        grandTotal: quote.grandTotal,
        lineItems: quote.lineItems,
      },
    });

    await this.quoteModel.updateOne({ _id: quote._id }, { $set: { convertedProjectId: project._id } });
    if (quote.opportunityId) {
      await this.opportunityModel.updateOne(
        { _id: quote.opportunityId, deletedAt: null },
        { $set: { status: OpportunityStatus.CONVERTED_TO_PROJECT, convertedProjectId: project._id } },
      );
    }

    await this.auditLogService.log({
      action: 'convert_to_project',
      entityType: 'Quote',
      entityId: quote._id,
      performedBy: userId,
      projectId: project._id,
      previousValues: { status: quote.status, convertedProjectId: quote.convertedProjectId },
      newValues: { convertedProjectId: project._id, projectNo },
    });

    return { project, quote: await this.findById(id) };
  }

  async softDelete(id: string, userId: string) {
    const existing = await this.getQuoteOrThrow(id);
    await this.quoteModel.updateOne({ _id: existing._id }, { $set: { deletedAt: new Date() } });
    await this.auditLogService.log({
      action: 'delete',
      entityType: 'Quote',
      entityId: existing._id,
      performedBy: userId,
    });
    return { message: 'Quote deleted' };
  }

  static calculateTotals(items: QuoteLineItemDto[], quoteLevel: { shippingCharge?: number; adjustment?: number } = {}) {
    if (!items?.length) {
      throw new BadRequestException('At least one line item is required');
    }

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    const lineItems = items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const costPrice = Number(item.costPrice || 0);
      const discountType = item.discountType || 'percentage';
      const discountValue = Number(item.discountValue ?? item.discountPercent ?? 0);
      const taxPercent = Number(item.taxPercent || 0);
      const gross = quantity * unitPrice;
      const discount = discountType === 'amount'
        ? Math.min(discountValue, gross)
        : gross * (discountValue / 100);
      const taxable = gross - discount;
      const tax = taxable * (taxPercent / 100);
      const lineTotal = taxable + tax;
      const costTotal = quantity * costPrice;
      const marginAmount = taxable - costTotal;
      const marginPercent = taxable > 0 ? (marginAmount / taxable) * 100 : 0;
      subtotal += gross;
      discountTotal += discount;
      taxTotal += tax;
      return {
        itemName: item.itemName?.trim() || '',
        sku: item.sku?.trim() || '',
        hsnSac: item.hsnSac?.trim() || '',
        description: item.description.trim(),
        unit: item.unit?.trim() || '',
        quantity: QuotesService.money(quantity),
        unitPrice: QuotesService.money(unitPrice),
        costPrice: QuotesService.money(costPrice),
        discountType,
        discountValue: QuotesService.money(discountValue),
        discountPercent: discountType === 'percentage' ? QuotesService.money(discountValue) : 0,
        taxName: item.taxName?.trim() || '',
        taxPercent: QuotesService.money(taxPercent),
        taxableAmount: QuotesService.money(taxable),
        marginAmount: QuotesService.money(marginAmount),
        marginPercent: QuotesService.money(marginPercent),
        lineTotal: QuotesService.money(lineTotal),
      };
    });

    const shippingCharge = Number(quoteLevel.shippingCharge || 0);
    const adjustment = Number(quoteLevel.adjustment || 0);
    const grandTotal = subtotal - discountTotal + taxTotal + shippingCharge + adjustment;
    return {
      lineItems,
      subtotal: QuotesService.money(subtotal),
      discountTotal: QuotesService.money(discountTotal),
      taxTotal: QuotesService.money(taxTotal),
      shippingCharge: QuotesService.money(shippingCharge),
      adjustment: QuotesService.money(adjustment),
      grandTotal: QuotesService.money(grandTotal),
    };
  }

  private async getQuoteOrThrow(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Quote not found');
    const quote = await this.quoteModel.findOne({ _id: id, deletedAt: null });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  private async getCustomerOrThrow(customerId: string) {
    if (!DatabaseId.isValid(customerId)) throw new BadRequestException('Customer is invalid');
    const customer = await this.customerModel.findOne({ _id: customerId, deletedAt: null });
    if (!customer) throw new BadRequestException('Customer not found');
    return customer;
  }

  private async assertOpportunityBelongsToCustomer(opportunityId: string, customerId: string) {
    if (!DatabaseId.isValid(opportunityId)) throw new BadRequestException('Machine inquiry is invalid');
    const opportunity = await this.opportunityModel.findOne({ _id: opportunityId, deletedAt: null }).select('customerId');
    if (!opportunity) throw new BadRequestException('Machine inquiry not found');
    if (String(opportunity.customerId) !== String(customerId)) {
      throw new BadRequestException('Machine inquiry does not belong to the selected customer');
    }
  }

  private buildCustomerSnapshot(customer: Customer) {
    const address = {
      address: customer.address || '',
      city: customer.city || '',
      stateProvince: customer.stateProvince || '',
      postalCode: customer.postalCode || '',
      country: customer.country || '',
    };
    return {
      name: (customer as any).displayName || customer.name,
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || customer.mobile || '',
      paymentTerms: customer.paymentTerms || '',
      taxTreatment: (customer as any).taxTreatment || '',
      taxRegistrationNumber: customer.vatNumber || '',
      billingAddress: address,
      shippingAddress: {
        address: (customer as any).shippingAddress || customer.address || '',
        city: (customer as any).shippingCity || customer.city || '',
        stateProvince: (customer as any).shippingStateProvince || customer.stateProvince || '',
        postalCode: (customer as any).shippingPostalCode || customer.postalCode || '',
        country: (customer as any).shippingCountry || customer.country || '',
      },
    };
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

  private static money(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async getCommercialPreferences() {
    const setting = await this.settingsService.get('commercial_preferences');
    return setting?.value ?? setting ?? {};
  }

  private defaultValidUntil(preferences: Record<string, any>) {
    const days = Number(preferences.defaultValidityDays || 30);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private buildOrganizationSnapshot(preferences: Record<string, any>) {
    return {
      organizationName: preferences.organizationName || 'MachineIQ',
      organizationEmail: preferences.organizationEmail || '',
      organizationPhone: preferences.organizationPhone || '',
      taxRegistrationNumber: preferences.taxRegistrationNumber || '',
      billingAddress: preferences.billingAddress || '',
      bankDetails: preferences.bankDetails || '',
    };
  }
}
