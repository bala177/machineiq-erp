import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CompanyDirectorEntity, CompanyDocumentEntity } from '../../database/entities/company-profile.entity';
import { CompanyEntity } from '../../database/entities/release1.entity';
import { DatabaseId } from '../../database/postgres-document.types';
import {
  CompanyDocumentKind, DIRECTOR_DOCUMENT_KINDS, IMAGE_ONLY_DOCUMENT_KINDS,
} from '../../schemas/organization.schema';
import { Role } from '../../common/enums';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateDirectorDto, UpdateDirectorDto, UploadCompanyDocumentDto } from './organization.dto';

const DOCUMENT_LABELS: Record<CompanyDocumentKind, string> = {
  [CompanyDocumentKind.LOGO]: 'company logo',
  [CompanyDocumentKind.CIN_CERTIFICATE]: 'certificate of incorporation',
  [CompanyDocumentKind.GST_CERTIFICATE]: 'GST registration certificate',
  [CompanyDocumentKind.PAN_CERTIFICATE]: 'company PAN card',
  [CompanyDocumentKind.TAN_CERTIFICATE]: 'TAN allotment letter',
  [CompanyDocumentKind.MSME_CERTIFICATE]: 'Udyam registration certificate',
  [CompanyDocumentKind.MOA]: 'Memorandum of Association',
  [CompanyDocumentKind.AOA]: 'Articles of Association',
  [CompanyDocumentKind.DIRECTOR_PHOTO]: 'director photograph',
  [CompanyDocumentKind.DIN_CERTIFICATE]: 'DIN allotment letter',
  [CompanyDocumentKind.DIRECTOR_AADHAAR]: 'director Aadhaar soft copy',
  [CompanyDocumentKind.DIRECTOR_PAN]: 'director PAN soft copy',
  [CompanyDocumentKind.SHAREHOLDING_CERTIFICATE]: 'share certificate',
};

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const CERTIFICATE_TYPES = [...IMAGE_TYPES, 'application/pdf'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_CERTIFICATE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class CompanyProfileService {
  constructor(
    @InjectRepository(CompanyEntity) private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(CompanyDirectorEntity) private readonly directors: Repository<CompanyDirectorEntity>,
    @InjectRepository(CompanyDocumentEntity) private readonly documents: Repository<CompanyDocumentEntity>,
    private readonly audit: AuditLogService,
  ) {}

  private async requireCompany(): Promise<CompanyEntity> {
    const company = await this.companies.findOne({ where: { deletedAt: IsNull() } });
    if (!company) throw new BadRequestException('Save the company profile before adding directors or documents');
    return company;
  }

  private async requireDirector(id: string, companyId: string): Promise<CompanyDirectorEntity> {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Director not found');
    const director = await this.directors.findOne({ where: { _id: id, companyId, deletedAt: IsNull() } });
    if (!director) throw new NotFoundException('Director not found');
    return director;
  }

  // ---------------------------------------------------------------- directors

  async listDirectors() {
    const company = await this.companies.findOne({ where: { deletedAt: IsNull() } });
    if (!company) return [];
    return this.directors.find({
      where: { companyId: company._id, deletedAt: IsNull() },
      order: { isActive: 'DESC', name: 'ASC' },
    });
  }

  async createDirector(dto: CreateDirectorDto, userId: string) {
    const company = await this.requireCompany();
    await this.assertDinAvailable(dto.din);
    const director = await this.directors.save(this.directors.create({ ...dto, companyId: company._id }));
    await this.audit.log({ action: 'create', entityType: 'CompanyDirector', entityId: director._id, performedBy: userId, newValues: director as unknown as Record<string, unknown> });
    return director;
  }

  async updateDirector(id: string, dto: UpdateDirectorDto, userId: string) {
    const company = await this.requireCompany();
    const existing = await this.requireDirector(id, company._id);
    if (dto.din && dto.din !== existing.din) await this.assertDinAvailable(dto.din);
    // A blank optional field is an instruction to clear it, not to skip it.
    const changes = {
      name: dto.name ?? existing.name,
      designation: dto.designation ?? null,
      din: dto.din ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      shareholdingPercent: dto.shareholdingPercent ?? null,
      appointedOn: dto.appointedOn ?? null,
      ...(dto.isActive === undefined ? {} : { isActive: dto.isActive }),
    };
    await this.directors.update({ _id: id }, changes);
    await this.audit.log({ action: 'update', entityType: 'CompanyDirector', entityId: id, performedBy: userId, previousValues: existing as unknown as Record<string, unknown>, newValues: changes });
    return this.directors.findOne({ where: { _id: id } });
  }

  async deleteDirector(id: string, userId: string) {
    const company = await this.requireCompany();
    const existing = await this.requireDirector(id, company._id);
    const removedAt = new Date();
    await this.documents.update({ directorId: id, deletedAt: IsNull() }, { deletedAt: removedAt });
    await this.directors.update({ _id: id }, { deletedAt: removedAt, isActive: false });
    await this.audit.log({ action: 'delete', entityType: 'CompanyDirector', entityId: id, performedBy: userId, previousValues: existing as unknown as Record<string, unknown> });
    return { message: 'Director removed' };
  }

  private async assertDinAvailable(din?: string) {
    if (!din) return;
    const clash = await this.directors.findOne({ where: { din, deletedAt: IsNull() } });
    if (clash) throw new ConflictException(`DIN ${din} is already recorded for ${clash.name}`);
  }

  // ---------------------------------------------------------------- documents

  async listDocuments() {
    const company = await this.companies.findOne({ where: { deletedAt: IsNull() } });
    if (!company) return [];
    // `content` is `select: false`, so this stays a metadata-only read.
    return this.documents.find({
      where: { companyId: company._id, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns the stored file.
   *
   * The logo is company branding and is read by anyone who prints a quotation.
   * Everything else — certificates, and above all the directors' Aadhaar and
   * PAN soft copies — is restricted to administrators who manage the
   * organization, so ordinary staff accounts cannot pull personal identity
   * documents out of the platform.
   */
  async readDocument(id: string, role?: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Document not found');
    const document = await this.documents.createQueryBuilder('document')
      .addSelect('document.content')
      .where('document._id = :id', { id })
      .getOne();
    if (!document) throw new NotFoundException('Document not found');
    if (document.kind !== CompanyDocumentKind.LOGO && role !== Role.ADMIN) {
      throw new ForbiddenException('Only an administrator can open statutory and identity documents');
    }
    return { _id: document._id, kind: document.kind, fileName: document.fileName, mimeType: document.mimeType, content: document.content };
  }

  async uploadDocument(dto: UploadCompanyDocumentDto, userId: string) {
    const company = await this.requireCompany();
    const directorId = await this.resolveDocumentOwner(dto, company._id);
    const sizeBytes = this.assertContent(dto);

    const replaced = await this.documents.findOne({
      where: { companyId: company._id, kind: dto.kind, deletedAt: IsNull(), directorId: directorId ?? IsNull() },
    });
    if (replaced) await this.documents.update({ _id: replaced._id }, { deletedAt: new Date() });

    const document = await this.documents.save(this.documents.create({
      companyId: company._id, directorId, kind: dto.kind, fileName: dto.fileName,
      mimeType: dto.mimeType, sizeBytes, content: dto.content, issuedOn: dto.issuedOn ?? null,
      uploadedBy: userId,
    }));
    await this.audit.log({
      action: replaced ? 'update' : 'create', entityType: 'CompanyDocument', entityId: document._id, performedBy: userId,
      previousValues: replaced ? { fileName: replaced.fileName, kind: replaced.kind } : undefined,
      newValues: { kind: document.kind, fileName: document.fileName, sizeBytes, directorId },
    });
    return this.documentSummary(document);
  }

  async deleteDocument(id: string, userId: string) {
    const company = await this.requireCompany();
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Document not found');
    const existing = await this.documents.findOne({ where: { _id: id, companyId: company._id, deletedAt: IsNull() } });
    if (!existing) throw new NotFoundException('Document not found');
    await this.documents.update({ _id: id }, { deletedAt: new Date() });
    await this.audit.log({ action: 'delete', entityType: 'CompanyDocument', entityId: id, performedBy: userId, previousValues: { kind: existing.kind, fileName: existing.fileName } });
    return { message: 'Document removed' };
  }

  /** Confirms the kind is filed against the right owner and returns the director it belongs to. */
  private async resolveDocumentOwner(dto: UploadCompanyDocumentDto, companyId: string): Promise<string | null> {
    const needsDirector = DIRECTOR_DOCUMENT_KINDS.includes(dto.kind);
    if (needsDirector) {
      if (!dto.directorId) throw new BadRequestException(`A ${this.label(dto.kind)} must be filed against a director`);
      const director = await this.requireDirector(dto.directorId, companyId);
      return director._id;
    }
    if (dto.directorId) throw new BadRequestException(`A ${this.label(dto.kind)} belongs to the company, not a director`);
    return null;
  }

  /** Validates the data URL against the kind and returns its decoded size. */
  private assertContent(dto: UploadCompanyDocumentDto): number {
    const imageOnly = IMAGE_ONLY_DOCUMENT_KINDS.includes(dto.kind);
    const allowed = imageOnly ? IMAGE_TYPES : CERTIFICATE_TYPES;
    const limit = imageOnly ? MAX_IMAGE_BYTES : MAX_CERTIFICATE_BYTES;

    const match = /^data:([a-z]+\/[a-z.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dto.content);
    if (!match) throw new BadRequestException('File must be uploaded as a base64 data URL');
    const [, mimeType, payload] = match;
    if (mimeType.toLowerCase() !== dto.mimeType.toLowerCase()) throw new BadRequestException('File type does not match its contents');
    if (!allowed.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(`A ${this.label(dto.kind)} must be ${imageOnly ? 'a PNG, JPEG, or WebP image' : 'a PDF, PNG, JPEG, or WebP file'}`);
    }
    const sizeBytes = Math.floor(payload.length * 0.75);
    if (sizeBytes < 1) throw new BadRequestException('File is empty');
    if (sizeBytes > limit) throw new BadRequestException(`A ${this.label(dto.kind)} must be ${limit / (1024 * 1024)} MB or smaller`);
    return sizeBytes;
  }

  private label(kind: CompanyDocumentKind) {
    return DOCUMENT_LABELS[kind];
  }

  /** The upload response mirrors a list row: metadata only, never the payload. */
  private documentSummary(document: CompanyDocumentEntity) {
    return {
      _id: document._id, companyId: document.companyId, directorId: document.directorId,
      kind: document.kind, fileName: document.fileName, mimeType: document.mimeType,
      sizeBytes: document.sizeBytes, issuedOn: document.issuedOn, uploadedBy: document.uploadedBy,
      createdAt: document.createdAt, updatedAt: document.updatedAt,
    };
  }
}
