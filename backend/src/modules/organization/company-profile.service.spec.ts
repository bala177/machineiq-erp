import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { CompanyDocumentKind } from '../../schemas/organization.schema';
import { CompanyProfileService } from './company-profile.service';

const COMPANY = { _id: 'company-id' };
const DIRECTOR = { _id: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', name: 'Ravi Menon', companyId: 'company-id' };
const pngOf = (bytes: number) => `data:image/png;base64,${'A'.repeat(Math.ceil(bytes / 0.75))}`;

describe('CompanyProfileService', () => {
  const companies = { findOne: jest.fn() };
  const directors = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(async (value) => ({ _id: 'director-id', ...value })), create: jest.fn((value) => value), update: jest.fn() };
  const documents = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(async (value) => ({ _id: 'document-id', ...value })), create: jest.fn((value) => value), update: jest.fn(), createQueryBuilder: jest.fn() };
  const audit = { log: jest.fn() };
  let service: CompanyProfileService;

  const upload = (overrides: Record<string, unknown> = {}) => service.uploadDocument({
    kind: CompanyDocumentKind.GST_CERTIFICATE, fileName: 'gst.pdf', mimeType: 'application/pdf',
    content: 'data:application/pdf;base64,QUJD', ...overrides,
  } as any, 'user-id');

  beforeEach(() => {
    jest.clearAllMocks();
    companies.findOne.mockResolvedValue(COMPANY);
    directors.findOne.mockResolvedValue(DIRECTOR);
    documents.findOne.mockResolvedValue(null);
    service = new CompanyProfileService(companies as any, directors as any, documents as any, audit as any);
  });

  it('refuses statutory records until the company profile exists', async () => {
    companies.findOne.mockResolvedValue(null);
    await expect(service.createDirector({ name: 'Ravi Menon' }, 'user-id')).rejects.toBeInstanceOf(BadRequestException);
    await expect(upload()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores a certificate with a server-derived size and an audit entry', async () => {
    const stored = await upload();
    expect(documents.save).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'company-id', directorId: null, kind: 'gst_certificate', sizeBytes: 3, uploadedBy: 'user-id',
    }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', entityType: 'CompanyDocument' }));
    expect(stored).not.toHaveProperty('content');
  });

  it('retires the previous file in a slot rather than duplicating it', async () => {
    documents.findOne.mockResolvedValue({ _id: 'old-id', fileName: 'old.pdf', kind: 'gst_certificate' });
    await upload();
    expect(documents.update).toHaveBeenCalledWith({ _id: 'old-id' }, { deletedAt: expect.any(Date) });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  it('rejects a data URL whose declared type contradicts its contents', async () => {
    await expect(upload({ mimeType: 'image/png' })).rejects.toThrow('does not match its contents');
  });

  it('rejects a file type the slot does not accept', async () => {
    await expect(upload({ kind: CompanyDocumentKind.LOGO, mimeType: 'application/pdf' }))
      .rejects.toThrow('PNG, JPEG, or WebP image');
  });

  it('caps a logo at 2 MB and a certificate at 5 MB', async () => {
    await expect(upload({ kind: CompanyDocumentKind.LOGO, mimeType: 'image/png', content: pngOf(3 * 1024 * 1024) }))
      .rejects.toThrow('2 MB or smaller');
    await expect(upload({ mimeType: 'image/png', content: pngOf(6 * 1024 * 1024) }))
      .rejects.toThrow('5 MB or smaller');
  });

  it('files personal soft copies against a director and company papers against the company', async () => {
    await expect(upload({ kind: CompanyDocumentKind.DIRECTOR_AADHAAR }))
      .rejects.toThrow('must be filed against a director');
    await expect(upload({ kind: CompanyDocumentKind.MOA, directorId: DIRECTOR._id }))
      .rejects.toThrow('belongs to the company, not a director');
    await upload({ kind: CompanyDocumentKind.DIRECTOR_AADHAAR, directorId: DIRECTOR._id });
    expect(documents.save).toHaveBeenCalledWith(expect.objectContaining({ directorId: DIRECTOR._id }));
  });

  it('lets any signed-in user read the logo but no other document', async () => {
    const stored = (kind: string) => ({
      getOne: async () => ({ _id: 'doc', kind, fileName: 'f', mimeType: 'application/pdf', content: 'data:...' }),
      addSelect() { return this; }, where() { return this; },
    });
    documents.createQueryBuilder.mockReturnValue(stored('logo'));
    await expect(service.readDocument('8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', 'designer')).resolves.toMatchObject({ kind: 'logo' });

    documents.createQueryBuilder.mockReturnValue(stored('director_aadhaar'));
    await expect(service.readDocument('8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', 'designer')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.readDocument('8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', 'admin')).resolves.toMatchObject({ kind: 'director_aadhaar' });
  });

  it('refuses a DIN already recorded against another director', async () => {
    directors.findOne.mockResolvedValue({ _id: 'other', name: 'Priya Nair' });
    await expect(service.createDirector({ name: 'Ravi Menon', din: '02451188' }, 'user-id')).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes a director together with their attachments', async () => {
    await service.deleteDirector(DIRECTOR._id, 'user-id');
    expect(documents.update).toHaveBeenCalledWith({ directorId: DIRECTOR._id, deletedAt: IsNull() }, { deletedAt: expect.any(Date) });
    expect(directors.update).toHaveBeenCalledWith({ _id: DIRECTOR._id }, { deletedAt: expect.any(Date), isActive: false });
  });

  it('clears a director field the admin has emptied', async () => {
    await service.updateDirector(DIRECTOR._id, { name: 'Ravi Menon' } as any, 'user-id');
    expect(directors.update).toHaveBeenCalledWith({ _id: DIRECTOR._id }, expect.objectContaining({ din: null, email: null, shareholdingPercent: null }));
  });
});
