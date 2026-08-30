'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate } from '@/lib/utils';
import { FileText, MessageSquare } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'documents' | 'decisions'>('documents');

  useEffect(() => {
    Promise.all([api.get<any[]>('/documents'), api.get<any[]>('/documents/decisions')])
      .then(([docs, decs]) => {
        setDocuments(docs);
        setDecisions(decs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader title="Documents & Decisions" description="Project files and decision log" />

      {/* Tab bar */}
      <div className="mb-6 flex border-b border-border">
        <button onClick={() => setTab('documents')} className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === 'documents' ? 'border-brand-600 text-brand-600' : 'border-transparent text-fg-muted hover:text-fg-secondary'}`}>
          Documents
        </button>
        <button onClick={() => setTab('decisions')} className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === 'decisions' ? 'border-brand-600 text-brand-600' : 'border-transparent text-fg-muted hover:text-fg-secondary'}`}>
          Decision Log
        </button>
      </div>

      {tab === 'documents' ? (
        documents.length === 0 ? (
          <EmptyState icon={<FileText className="h-10 w-10" />} title="No documents uploaded" />
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc._id} className="card-hover flex items-center gap-3.5 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-tertiary">
                  <FileText className="h-5 w-5 text-fg-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">{doc.title}</p>
                  <p className="text-xs text-fg-tertiary">
                    By {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName} · {formatDate(doc.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-fg-tertiary">{doc.fileType}</span>
              </div>
            ))}
          </div>
        )
      ) : decisions.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-10 w-10" />} title="No decisions recorded" />
      ) : (
        <div className="space-y-3">
          {decisions.map((dec) => (
            <div key={dec._id} className="card p-4">
              <p className="text-sm font-semibold text-fg">{dec.title}</p>
              <p className="mt-1 text-sm text-fg-secondary">{dec.decision}</p>
              {dec.rationale && <p className="mt-1 text-xs text-fg-tertiary italic">{dec.rationale}</p>}
              <div className="mt-2 flex items-center gap-3 text-xs text-fg-muted">
                <span>
                  By {dec.madeBy?.firstName} {dec.madeBy?.lastName}
                </span>
                <span>{formatDate(dec.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
