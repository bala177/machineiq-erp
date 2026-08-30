import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

/**
 * PostgreSQL persistence for the existing engineering-execution domains while
 * their release-specific relational models are introduced. Identity, master
 * data, permissions, numbering, and audit already use dedicated relational
 * tables; this table keeps the remaining API contracts PostgreSQL-only during
 * the Release 1 cutover.
 */
@Entity('runtime_documents')
@Unique(['domain', '_id'])
@Index(['domain', 'deletedAt'])
export class RuntimeDocumentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  _id: string;

  @Column({ length: 80 })
  domain: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  data: Record<string, unknown>;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
