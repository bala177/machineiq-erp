import { api } from './api';

export type CompanyDocumentKind =
  | 'logo' | 'cin_certificate' | 'gst_certificate' | 'pan_certificate' | 'tan_certificate'
  | 'msme_certificate' | 'moa' | 'aoa' | 'director_photo' | 'din_certificate'
  | 'director_aadhaar' | 'director_pan' | 'shareholding_certificate';

export type CompanyDocument = {
  _id: string;
  directorId: string | null;
  kind: CompanyDocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export const documentLabels: Record<CompanyDocumentKind, string> = {
  logo: 'Company logo',
  cin_certificate: 'Certificate of incorporation',
  gst_certificate: 'GST registration certificate',
  pan_certificate: 'PAN card',
  tan_certificate: 'TAN allotment letter',
  msme_certificate: 'Udyam registration certificate',
  moa: 'Memorandum of Association',
  aoa: 'Articles of Association',
  director_photo: 'Photograph',
  din_certificate: 'DIN allotment letter',
  director_aadhaar: 'Aadhaar (soft copy)',
  director_pan: 'PAN (soft copy)',
  shareholding_certificate: 'Share certificate',
};

/** Kinds that must be a picture; everything else also accepts a scanned PDF. */
export const imageOnlyKinds: CompanyDocumentKind[] = ['logo', 'director_photo'];

export function acceptFor(kind: CompanyDocumentKind) {
  return imageOnlyKinds.includes(kind) ? 'image/png,image/jpeg,image/webp' : 'application/pdf,image/png,image/jpeg,image/webp';
}

export function maxBytesFor(kind: CompanyDocumentKind) {
  return imageOnlyKinds.includes(kind) ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadCompanyDocument(kind: CompanyDocumentKind, file: File, directorId?: string) {
  const limit = maxBytesFor(kind);
  if (file.size > limit) throw new Error(`${documentLabels[kind]} must be ${limit / (1024 * 1024)} MB or smaller.`);
  return api.post<CompanyDocument>('/organization/documents', {
    kind,
    ...(directorId ? { directorId } : {}),
    fileName: file.name.slice(0, 260),
    mimeType: file.type,
    content: await readAsDataUrl(file),
  });
}

export async function fetchDocumentContent(id: string) {
  return api.get<{ _id: string; fileName: string; mimeType: string; content: string }>(`/organization/documents/${id}/content`);
}

/**
 * Opens a stored attachment in a new tab. The payload arrives as a data URL,
 * which browsers refuse to navigate to directly, so it is re-wrapped as a blob.
 */
export async function openCompanyDocument(id: string) {
  const document = await fetchDocumentContent(id);
  const [, base64] = document.content.split(',');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: document.mimeType }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * The current company logo as a data URL, or null when none is set.
 *
 * Printed documents read the logo live rather than from the snapshot taken when
 * the document was raised, so re-branding applies to reprints of older quotes.
 */
export async function fetchCompanyLogo(): Promise<string | null> {
  try {
    const documents = await api.get<CompanyDocument[]>('/organization/documents');
    const logo = documents.find((document) => !document.directorId && document.kind === 'logo');
    if (!logo) return null;
    return (await fetchDocumentContent(logo._id)).content;
  } catch {
    // A missing logo must never stop a quote from printing.
    return null;
  }
}
