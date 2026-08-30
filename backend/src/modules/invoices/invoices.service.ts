import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { InvoiceStatus, QuoteStatus } from '../../common/enums';
import { Invoice } from '../../schemas/invoice.schema';
import { Project } from '../../schemas/project.schema';
import { Quote } from '../../schemas/quote.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateInvoiceFromQuoteDto } from './invoices.dto';
import { DocumentTypesService } from '../document-types/document-types.service';

const ACTIVE_INVOICE_STATUSES = [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE];
const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT, InvoiceStatus.VOID],
  [InvoiceStatus.SENT]: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  [InvoiceStatus.UNPAID]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  [InvoiceStatus.OVERDUE]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.VOID],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.VOID]: [],
};

type InvoiceListQuery = {
  customerId?: string;
  sourceQuoteId?: string;
  projectId?: string;
  status?: string;
  limit?: string | number;
  skip?: string | number;
};

@Injectable()
export class InvoicesService {
  constructor(
    @InjectPgModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectPgModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectPgModel(Project.name) private projectModel: Model<Project>,
    private auditLogService: AuditLogService,
    private documentTypesService: DocumentTypesService,
  ) {}

  async createFromQuote(quoteId: string, dto: CreateInvoiceFromQuoteDto, userId: string) {
    const quote = await this.getQuoteOrThrow(quoteId);
    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Only accepted quotes can be invoiced');
    }

    const duplicate = await this.invoiceModel.findOne({
      sourceQuoteId: quote._id,
      status: { $in: ACTIVE_INVOICE_STATUSES },
      deletedAt: null,
    });
    if (duplicate) {
      throw new BadRequestException('This quote already has an active invoice');
    }

    const projectId = await this.resolveProjectId(quote, dto.projectId);
    const invoiceNo = await this.documentTypesService.generate('invoice');
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : this.defaultDueDate(invoiceDate);
    const invoice = await this.invoiceModel.create({
      invoiceNo,
      customerId: quote.customerId,
      sourceQuoteId: quote._id,
      projectId,
      status: InvoiceStatus.DRAFT,
      invoiceDate,
      dueDate,
      currency: quote.currency,
      customerSnapshot: quote.customerSnapshot,
      lineItems: quote.lineItems,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      taxTotal: quote.taxTotal,
      shippingCharge: quote.shippingCharge,
      adjustment: quote.adjustment,
      grandTotal: quote.grandTotal,
      amountPaid: 0,
      balanceDue: quote.grandTotal,
      notes: dto.notes ?? quote.notes,
      terms: quote.terms,
      organizationSnapshot: quote.organizationSnapshot,
      createdBy: userId,
    });

    await this.auditLogService.log({
      action: 'create_from_quote',
      entityType: 'Invoice',
      entityId: invoice._id,
      performedBy: userId,
      projectId: projectId || undefined,
      newValues: { invoiceNo, sourceQuoteId: quote._id, grandTotal: quote.grandTotal },
    });

    return this.findById(String(invoice._id));
  }

  async findAll(query: InvoiceListQuery = {}) {
    const filter: any = { deletedAt: null };
    if (query.customerId && DatabaseId.isValid(query.customerId)) filter.customerId = query.customerId;
    if (query.sourceQuoteId && DatabaseId.isValid(query.sourceQuoteId)) filter.sourceQuoteId = query.sourceQuoteId;
    if (query.projectId && DatabaseId.isValid(query.projectId)) filter.projectId = query.projectId;
    if (query.status && Object.values(InvoiceStatus).includes(query.status as InvoiceStatus)) filter.status = query.status;

    const requestedLimit = Number(query.limit);
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
    const requestedSkip = Number(query.skip);
    const skip = Number.isInteger(requestedSkip) && requestedSkip >= 0 ? requestedSkip : 0;

    const [data, total] = await Promise.all([
      this.invoiceModel
        .find(filter)
        .populate('customerId', 'name contactPerson email phone')
        .populate('sourceQuoteId', 'quoteNo status')
        .populate('projectId', 'projectNo name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.invoiceModel.countDocuments(filter),
    ]);

    return { data, total, limit, skip };
  }

  async findById(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Invoice not found');
    const invoice = await this.invoiceModel
      .findOne({ _id: id, deletedAt: null })
      .populate('customerId', 'name contactPerson email phone')
      .populate('sourceQuoteId', 'quoteNo status')
      .populate('projectId', 'projectNo name')
      .populate('createdBy', 'firstName lastName email')
      .exec();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus, userId: string) {
    const invoice = await this.getInvoiceOrThrow(id);
    if (invoice.status === status) return this.findById(id);
    if (!STATUS_TRANSITIONS[invoice.status as InvoiceStatus]?.includes(status)) {
      throw new BadRequestException(`Cannot move invoice from ${invoice.status} to ${status}`);
    }

    const updates: Record<string, any> = { status };
    if (status === InvoiceStatus.PAID) {
      updates.amountPaid = invoice.grandTotal;
      updates.balanceDue = 0;
    }

    await this.invoiceModel.updateOne({ _id: invoice._id }, { $set: updates });
    await this.auditLogService.log({
      action: 'status_change',
      entityType: 'Invoice',
      entityId: invoice._id,
      performedBy: userId,
      projectId: invoice.projectId || undefined,
      previousValues: { status: invoice.status },
      newValues: updates,
    });

    return this.findById(id);
  }

  async recordPayment(id: string, amount: number, userId: string) {
    const invoice = await this.getInvoiceOrThrow(id);
    if ([InvoiceStatus.DRAFT, InvoiceStatus.VOID, InvoiceStatus.PAID].includes(invoice.status)) {
      throw new BadRequestException('Payment can only be recorded against an open invoice');
    }

    const amountPaid = this.money(Number(invoice.amountPaid || 0) + amount);
    const cappedPaid = Math.min(amountPaid, invoice.grandTotal);
    const balanceDue = this.money(invoice.grandTotal - cappedPaid);
    const status = balanceDue <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

    await this.invoiceModel.updateOne({ _id: invoice._id }, { $set: { amountPaid: cappedPaid, balanceDue, status } });
    await this.auditLogService.log({
      action: 'payment_recorded',
      entityType: 'Invoice',
      entityId: invoice._id,
      performedBy: userId,
      projectId: invoice.projectId || undefined,
      newValues: { amount, amountPaid: cappedPaid, balanceDue, status },
    });

    return this.findById(id);
  }

  private async getQuoteOrThrow(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Quote not found');
    const quote = await this.quoteModel.findOne({ _id: id, deletedAt: null });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  private async getInvoiceOrThrow(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Invoice not found');
    const invoice = await this.invoiceModel.findOne({ _id: id, deletedAt: null });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async resolveProjectId(quote: any, requestedProjectId?: string) {
    const projectId = requestedProjectId || quote.convertedProjectId;
    if (!projectId) return null;
    if (!DatabaseId.isValid(String(projectId))) throw new BadRequestException('Project is invalid');
    const project = await this.projectModel.findOne({ _id: projectId, deletedAt: null }).select('sourceQuoteId');
    if (!project) throw new BadRequestException('Project not found');
    if (project.sourceQuoteId && String(project.sourceQuoteId) !== String(quote._id)) {
      throw new BadRequestException('Project is not linked to this quote');
    }
    return project._id;
  }

  private defaultDueDate(invoiceDate: Date) {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }

  private money(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
