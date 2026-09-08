import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyDocumentKind } from '../../schemas/organization.schema';
import { BaseEntity } from './base.entity';
import { CompanyEntity, UserEntity } from './release1.entity';

const percentTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('company_directors')
@Index(['companyId'])
export class CompanyDirectorEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @ManyToOne(() => CompanyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' }) company: CompanyEntity;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) designation: string | null;
  @Column({ type: 'varchar', length: 8, nullable: true }) din: string | null;
  @Column({ type: 'varchar', length: 320, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone: string | null;
  @Column({ name: 'shareholding_percent', type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: percentTransformer })
  shareholdingPercent: number | null;
  @Column({ name: 'appointed_on', type: 'date', nullable: true }) appointedOn: string | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

/**
 * Every statutory attachment for the company setup — the logo, the CIN/GST/PAN/
 * TAN/MSME certificates, MOA and AOA, and the per-director soft copies.
 *
 * The file itself is held as a base64 data URL in `content`, which is
 * `select: false` so that listing attachments never drags the blobs along.
 */
@Entity('company_documents')
@Index(['companyId', 'kind'])
export class CompanyDocumentEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @ManyToOne(() => CompanyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' }) company: CompanyEntity;
  @Column({ name: 'director_id', type: 'uuid', nullable: true }) directorId: string | null;
  @ManyToOne(() => CompanyDirectorEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'director_id' }) director: CompanyDirectorEntity | null;
  @Column({ type: 'varchar', length: 40 }) kind: CompanyDocumentKind;
  @Column({ name: 'file_name', type: 'varchar', length: 260 }) fileName: string;
  @Column({ name: 'mime_type', type: 'varchar', length: 100 }) mimeType: string;
  @Column({ name: 'size_bytes', type: 'integer' }) sizeBytes: number;
  @Column({ type: 'text', select: false }) content: string;
  @Column({ name: 'issued_on', type: 'date', nullable: true }) issuedOn: string | null;
  @Column({ name: 'uploaded_by', type: 'uuid' }) uploadedBy: string;
  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by' }) uploader: UserEntity;
}

/** Relational entities backing the statutory company profile. */
export const COMPANY_PROFILE_ENTITIES = [CompanyDirectorEntity, CompanyDocumentEntity] as const;
