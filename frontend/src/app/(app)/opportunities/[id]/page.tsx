'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock3,
  FilePenLine, FileImage, FileText, MessageSquare, Paperclip,
  PlayCircle, Plus, RotateCcw, Save, Send, ShieldCheck, Trash2, UserCheck, XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '@/lib/api';
import { DiscussionBoard } from '@/components/discussion/discussion-board';
import { DiscussionEntry, stripHtml } from '@/lib/discussion';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { StageTrack } from '@/components/ui/stage-track';
import { ReferencesAndPhotosPanel } from '@/components/opportunities/references-and-photos-panel';
import { MachineChecklistCard } from '@/components/opportunities/machine-checklist-card';
import { formatDate, formatStatus } from '@/lib/utils';
import { OPPORTUNITY_STAGE_TRACK, OPPORTUNITY_WORKFLOW } from '@/lib/opportunities';
import { formatMoney, QuoteRecord } from '@/lib/quotes';
import { useAuth } from '@/providers/auth-provider';

/* ─── Types ─────────────────────────────────────────────────────────── */

type AuditEntry = {
  _id: string;
  action: string;
  createdAt: string;
  performedBy?: { firstName?: string; lastName?: string };
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
};

type ReferencePhoto = { url: string; caption?: string; kind?: string; uploadedAt?: string };

export type DiscussionUser = {
  _id: string;
  id?: string;            // some Mongoose configs serialise as `id`
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

/* ─── Tabs ───────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
  { id: 'files',      label: 'Files',       icon: Paperclip },
] as const;
type TabId = (typeof TABS)[number]['id'];

const PM_ROLES = new Set(['admin', 'manager']);
const REVIEWER_ROLES = new Set(['admin', 'manager', 'designer']);
const REVIEW_EDITABLE_STATUSES = new Set(['draft', 'new', 'under_review', 'feasibility_in_progress']);

const FEASIBILITY_RATINGS = [
  { value: '', label: 'Not rated' },
  { value: 'feasible', label: 'Feasible' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'not_feasible', label: 'Not feasible' },
];

const COMPLEXITY_RATINGS = [
  { value: '', label: 'Not rated' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very high' },
];

const RISK_RATINGS = [
  { value: '', label: 'Not rated' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const BUDGET_ALIGNMENT = [
  { value: '', label: 'Not checked' },
  { value: 'on_budget', label: 'On budget' },
  { value: 'borderline', label: 'Borderline' },
  { value: 'over_budget', label: 'Over budget' },
];

type ReviewDraft = {
  assignedReviewer: string;
  feasibilityRating: string;
  feasibilityNotes: string;
  complexityRating: string;
  complexityNotes: string;
  riskRating: string;
  riskNotes: string;
  budgetAlignment: string;
  budgetNotes: string;
};

function reviewerIdFrom(value: any): string {
  if (!value) return '';
  return typeof value === 'string' ? value : (value._id ?? value.id ?? '');
}

function reviewerNameFrom(value: any): string {
  if (!value) return 'Unassigned';
  if (typeof value === 'string') return 'Assigned reviewer';
  return `${value.firstName || ''} ${value.lastName || ''}`.trim() || value.email || 'Assigned reviewer';
}

function workflowMeta(status: string) {
  return OPPORTUNITY_WORKFLOW.find((step) => step.status === status);
}

function nextWorkflowCopy(status: string, hasReviewer: boolean, reviewComplete: boolean) {
  switch (status) {
    case 'draft':
      return {
        title: 'Submit the request',
        body: 'Move the intake into the active pipeline when the customer and machine details are ready for triage.',
      };
    case 'new':
      return hasReviewer
        ? {
            title: 'Send to technical review',
            body: 'The reviewer is assigned. Move the request to Under Review so feasibility work can start.',
          }
        : {
            title: 'Assign a technical reviewer',
            body: 'A PM/admin must choose the accountable reviewer before this request can leave New.',
          };
    case 'under_review':
      return {
        title: 'Start feasibility',
        body: 'The assigned reviewer or PM/admin can move this request into feasibility and record findings.',
      };
    case 'feasibility_in_progress':
      return reviewComplete
        ? {
            title: 'Approve or reject',
            body: 'Feasibility, complexity, and risk notes are complete. PM/admin can make the decision.',
          }
        : {
            title: 'Complete feasibility notes',
            body: 'Approval is blocked until feasibility, complexity, and risk notes are recorded.',
          };
    case 'approved':
      return {
        title: 'Convert to project',
        body: 'The request is approved. Create the project to start delivery planning and engineering.',
      };
    case 'rejected':
      return {
        title: 'Reopen only if scope changes',
        body: 'Rejected requests stay closed unless PM/admin sends them back to review.',
      };
    case 'converted_to_project':
      return {
        title: 'Continue in the project workspace',
        body: 'The inquiry is locked and the linked project is now the execution record.',
      };
    default:
      return { title: 'Review status', body: 'Check the activity log for the latest workflow action.' };
  }
}

/* ─── Activity timeline helpers ──────────────────────────────────────── */

type ActionMeta = { label: string; icon: React.ElementType; dot: string; iconBg: string };

const ACTION_META: Record<string, ActionMeta> = {
  create:               { label: 'Machine Inquiry created',         icon: Plus,         dot: 'bg-emerald-500', iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  create_from_template: { label: 'Created from template',       icon: Plus,         dot: 'bg-emerald-500', iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  intake_update:        { label: 'Intake updated',               icon: FilePenLine,  dot: 'bg-brand-500',   iconBg: 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' },
  status_change:        { label: 'Status changed',               icon: ArrowRight,   dot: 'bg-sky-500',     iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
  add_reference:        { label: 'Reference material added',     icon: FileImage,    dot: 'bg-violet-500',  iconBg: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  remove_reference:     { label: 'Reference material removed',   icon: FileImage,    dot: 'bg-rose-400',    iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  convert_to_project:   { label: 'Converted to project',         icon: CheckCircle2, dot: 'bg-indigo-500',  iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' },
};

type TimelineItem =
  | { kind: 'audit'; ts: number; entry: AuditEntry }
  | { kind: 'note';  ts: number; entry: DiscussionEntry };

const DEFAULT_ACTION_META: ActionMeta = {
  label: '',
  icon: Clock3,
  dot: 'bg-slate-400',
  iconBg: 'bg-slate-100 text-slate-600',
};

function personName(person?: { firstName?: string; lastName?: string }) {
  if (!person) return 'System';
  return `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'System';
}

function formatRelTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return formatDate(iso);
}

/* ─── Activity timeline ───────────────────────────────────────────────── */

function ActivityTimeline({ auditEntries, discussionEntries }: { auditEntries: AuditEntry[]; discussionEntries: DiscussionEntry[] }) {
  const combined: TimelineItem[] = [
    ...auditEntries.map(e  => ({ kind: 'audit' as const, ts: new Date(e.createdAt).getTime(),  entry: e })),
    ...discussionEntries.map(e => ({ kind: 'note'  as const, ts: new Date(e.createdAt).getTime(), entry: e })),
  ].sort((a, b) => b.ts - a.ts);

  if (combined.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
          <Clock3 className="h-4 w-4 text-fg-muted" />
        </div>
        <p className="text-xs text-fg-muted">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[18px] top-6 bottom-2 w-px bg-border" />
      <div className="space-y-0">
        {combined.map((item, idx) => {
          const isLast = idx === combined.length - 1;

          if (item.kind === 'note') {
            const note = item.entry;
            const preview = stripHtml(note.content);
            const noteParticipants = (note.participants || [])
              .map((p) => `${p.firstName || ''} ${p.lastName || ''}`.trim())
              .filter(Boolean);
            const noteExternal = (note.externalParticipants || []).filter(Boolean);
            const allWith = [...noteParticipants, ...noteExternal];
            return (
              <div key={`note-${note._id}`} className={clsx('relative flex gap-4', !isLast && 'pb-5')}>
                <div className="relative z-10 flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-surface shadow-sm bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-fg leading-tight">Note added</p>
                    <time className="text-xs text-fg-muted shrink-0 mt-0.5">{formatRelTime(note.createdAt)}</time>
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    by {personName(note.authorId)}
                    {allWith.length > 0 && (
                      <span className="text-fg-muted"> · with {allWith.join(', ')}</span>
                    )}
                  </p>
                  {preview && (
                    <p className="mt-1 text-xs text-fg-secondary leading-relaxed line-clamp-2">
                      {preview.length > 80 ? preview.slice(0, 80) + '…' : preview}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          const entry = item.entry;
          const meta = ACTION_META[entry.action] ?? { ...DEFAULT_ACTION_META, label: formatStatus(entry.action) };
          const Icon = meta.icon;
          return (
            <div key={`audit-${entry._id}`} className={clsx('relative flex gap-4', !isLast && 'pb-5')}>
              <div className="relative z-10 flex-shrink-0">
                <div className={clsx('flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-surface shadow-sm', meta.iconBg)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-fg leading-tight">{meta.label}</p>
                  <time className="text-xs text-fg-muted shrink-0 mt-0.5">{formatRelTime(entry.createdAt)}</time>
                </div>
                <p className="mt-0.5 text-xs text-fg-muted">by {personName(entry.performedBy)}</p>
                {entry.action === 'status_change' && typeof entry.newValues?.status === 'string' && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {typeof entry.previousValues?.status === 'string' && (
                      <>
                        <span className="rounded-full bg-surface-secondary border border-border px-2.5 py-0.5 text-xs text-fg-secondary">
                          {formatStatus(entry.previousValues.status)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-fg-muted" />
                      </>
                    )}
                    <StatusBadge status={entry.newValues.status} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('discussion');
  const [opportunity, setOpportunity] = useState<any>(null);
  const [users, setUsers] = useState<DiscussionUser[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [discussionEntries, setDiscussionEntries] = useState<DiscussionEntry[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [localAttachments, setLocalAttachments] = useState<Array<{ name: string; dataUrl: string }>>([]);
  const [workflowBusy, setWorkflowBusy] = useState('');
  const [workflowError, setWorkflowError] = useState('');
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>({
    assignedReviewer: '',
    feasibilityRating: '',
    feasibilityNotes: '',
    complexityRating: '',
    complexityNotes: '',
    riskRating: '',
    riskNotes: '',
    budgetAlignment: '',
    budgetNotes: '',
  });

  const userId = user?.id || (user as any)?._id || '';
  const userRole = user?.role || '';
  const isPmRole = PM_ROLES.has(userRole);
  const canDelete = userRole === 'admin' || userRole === 'manager';
  const canEditIntake = Boolean(
    opportunity && opportunity.status !== 'converted_to_project' && ['sales', 'admin'].includes(userRole)
  );
  const canCreateQuote = Boolean(
    opportunity &&
    ['sales', 'admin'].includes(userRole) &&
    !['draft', 'rejected', 'converted_to_project'].includes(opportunity.status),
  );

  const refreshActivity = async () => {
    try {
      const [auditData, noteData] = await Promise.all([
        api.get<AuditEntry[]>(`/audit-logs?entityType=Opportunity&entityId=${params.id}`),
        api.get<DiscussionEntry[]>(`/opportunities/${params.id}/discussion`),
      ]);
      setAuditEntries(auditData);
      setDiscussionEntries(noteData);
    } catch { /* keep current */ }
  };

  const applyOpportunityUpdate = async (updated: any) => {
    setOpportunity(updated);
    await refreshActivity();
  };

  const changeStatus = async (status: string, busyLabel = status) => {
    setWorkflowBusy(busyLabel);
    setWorkflowError('');
    try {
      const updated = await api.patch<any>(`/opportunities/${params.id}/status`, { status });
      await applyOpportunityUpdate(updated);
    } catch (err: any) {
      setWorkflowError(err.message || 'Failed to update status');
    } finally {
      setWorkflowBusy('');
    }
  };

  const saveReviewer = async () => {
    if (!reviewDraft.assignedReviewer) {
      setWorkflowError('Select a reviewer before saving.');
      return null;
    }
    setWorkflowBusy('reviewer');
    setWorkflowError('');
    try {
      const updated = await api.patch<any>(`/opportunities/${params.id}/review`, {
        assignedReviewer: reviewDraft.assignedReviewer,
      });
      await applyOpportunityUpdate(updated);
      return updated;
    } catch (err: any) {
      setWorkflowError(err.message || 'Failed to save reviewer');
      return null;
    } finally {
      setWorkflowBusy('');
    }
  };

  const sendToReview = async () => {
    const currentReviewerId = reviewerIdFrom(opportunity?.assignedReviewer);
    if (!reviewDraft.assignedReviewer) {
      setWorkflowError('Assign a reviewer before sending to review.');
      return;
    }
    if (reviewDraft.assignedReviewer !== currentReviewerId) {
      const saved = await saveReviewer();
      if (!saved) return;
    }
    await changeStatus('under_review', 'under_review');
  };

  const saveReviewNotes = async () => {
    setWorkflowBusy('review_notes');
    setWorkflowError('');
    try {
      const updated = await api.patch<any>(`/opportunities/${params.id}/review`, {
        feasibilityRating: reviewDraft.feasibilityRating || undefined,
        feasibilityNotes: reviewDraft.feasibilityNotes.trim(),
        complexityRating: reviewDraft.complexityRating || undefined,
        complexityNotes: reviewDraft.complexityNotes.trim(),
        riskRating: reviewDraft.riskRating || undefined,
        riskNotes: reviewDraft.riskNotes.trim(),
        budgetAlignment: reviewDraft.budgetAlignment || undefined,
        budgetNotes: reviewDraft.budgetNotes.trim(),
      });
      await applyOpportunityUpdate(updated);
      return updated;
    } catch (err: any) {
      setWorkflowError(err.message || 'Failed to save feasibility review');
      return null;
    } finally {
      setWorkflowBusy('');
    }
  };

  const resolveFeasibility = async (status: 'approved' | 'rejected') => {
    if (!reviewComplete) {
      const action = status === 'approved' ? 'approval' : 'rejection';
      setWorkflowError(
        `Complete feasibility, complexity, and risk notes before ${action}. A recorded assessment is required for both decisions.`,
      );
      return;
    }
    const saved = await saveReviewNotes();
    if (!saved) return;
    await changeStatus(status, status);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [opp, userData, noteData] = await Promise.all([
          api.get<any>(`/opportunities/${params.id}`),
          api.get<DiscussionUser[]>('/users').catch(() => [] as DiscussionUser[]),
          api.get<DiscussionEntry[]>(`/opportunities/${params.id}/discussion`).catch(() => [] as DiscussionEntry[]),
        ]);
        if (cancelled) return;
        setOpportunity(opp);
        setUsers(userData);
        setDiscussionEntries(noteData);
        api.get<{ data: QuoteRecord[] }>(`/quotes?opportunityId=${params.id}&limit=100`)
          .then((d) => { if (!cancelled) setQuotes(d.data); })
          .catch(() => { if (!cancelled) setQuotes([]); });
        const saved = (opp.attachments || []) as string[];
        setLocalAttachments(
          saved.filter((a: string) => a.startsWith('data:')).map((dataUrl: string, i: number) => {
            const mime = dataUrl.split(';')[0].replace('data:', '');
            const ext = mime.includes('/') ? mime.split('/')[1].split('+')[0] : 'file';
            return { name: `attachment-${i + 1}.${ext}`, dataUrl };
          }),
        );
        api.get<AuditEntry[]>(`/audit-logs?entityType=Opportunity&entityId=${params.id}`)
          .then((d) => { if (!cancelled) setAuditEntries(d); })
          .catch(() => {});
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to load machine inquiry');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [params.id]);

  useEffect(() => {
    if (!opportunity) return;
    setReviewDraft({
      assignedReviewer: reviewerIdFrom(opportunity.assignedReviewer),
      feasibilityRating: opportunity.feasibilityRating || '',
      feasibilityNotes: opportunity.feasibilityNotes || '',
      complexityRating: opportunity.complexityRating || '',
      complexityNotes: opportunity.complexityNotes || '',
      riskRating: opportunity.riskRating || '',
      riskNotes: opportunity.riskNotes || '',
      budgetAlignment: opportunity.budgetAlignment || '',
      budgetNotes: opportunity.budgetNotes || '',
    });
  }, [
    opportunity?._id,
    opportunity?.assignedReviewer,
    opportunity?.feasibilityRating,
    opportunity?.feasibilityNotes,
    opportunity?.complexityRating,
    opportunity?.complexityNotes,
    opportunity?.riskRating,
    opportunity?.riskNotes,
    opportunity?.budgetAlignment,
    opportunity?.budgetNotes,
  ]);

  // Poll activity every 30 s
  useEffect(() => {
    const interval = setInterval(refreshActivity, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleReferencePhotosChanged = async (next: ReferencePhoto[]) => {
    setOpportunity((cur: any) => cur ? { ...cur, referencePhotos: next } : cur);
    await refreshActivity();
  };

  const handleDeleteOpportunity = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/opportunities/${params.id}`);
      router.push('/opportunities');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete machine inquiry');
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-sm text-fg-tertiary p-8">Loading machine inquiry…</p>;

  if (!opportunity) {
    return (
      <div className="card p-5">
        <p className="text-sm text-fg-tertiary">{error || 'Machine Inquiry not found.'}</p>
      </div>
    );
  }

  const fileCount = localAttachments.length + (opportunity.referencePhotos?.length || 0);
  const currentReviewerId = reviewerIdFrom(opportunity.assignedReviewer);
  const reviewerOptions = users.filter((u) => REVIEWER_ROLES.has(u.role || ''));
  const isAssignedReviewer = Boolean(userId && currentReviewerId === userId);
  const canSubmitDraft = opportunity.status === 'draft' && (userRole === 'sales' || isPmRole);
  const canAssignReviewer = isPmRole && ['new', 'under_review', 'feasibility_in_progress'].includes(opportunity.status);
  const canSendToReview = isPmRole && opportunity.status === 'new' && Boolean(reviewDraft.assignedReviewer);
  const canStartFeasibility =
    opportunity.status === 'under_review' && (isPmRole || isAssignedReviewer);
  const canEditReview =
    REVIEW_EDITABLE_STATUSES.has(opportunity.status) && (isPmRole || isAssignedReviewer);
  const reviewComplete = Boolean(
    reviewDraft.feasibilityNotes.trim() &&
    reviewDraft.complexityNotes.trim() &&
    reviewDraft.riskNotes.trim(),
  );
  const canResolveFeasibility = isPmRole && opportunity.status === 'feasibility_in_progress';
  const canReopen = isPmRole && opportunity.status === 'rejected';
  const reviewNotesEmpty = Boolean(
    !reviewDraft.feasibilityNotes.trim() &&
    !reviewDraft.complexityNotes.trim() &&
    !reviewDraft.riskNotes.trim(),
  );
  const nextStep = nextWorkflowCopy(opportunity.status, Boolean(currentReviewerId || reviewDraft.assignedReviewer), reviewComplete);
  const activeWorkflowMeta = workflowMeta(opportunity.status);

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusBadge status={opportunity.status} />
            {opportunity.priority && <StatusBadge status={opportunity.priority} />}
            {opportunity.requestNo && (
              <span className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-mono text-fg-secondary">
                {opportunity.requestNo}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-fg">{opportunity.title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {canEditIntake && (
            <Link href={`/opportunities/${opportunity._id}?tab=intake`} className="btn-secondary">
              Edit Intake
            </Link>
          )}
          {canCreateQuote && (
            <Link
              href={`/quotes/new?opportunityId=${opportunity._id}&customerId=${opportunity.customerId?._id ?? opportunity.customerId}`}
              className="btn-secondary"
            >
              <FileText className="h-4 w-4" />
              Create Quote
            </Link>
          )}
          {opportunity.status === 'converted_to_project' && opportunity.convertedProjectId && (
            <Link
              href={`/projects/${opportunity.convertedProjectId?._id ?? opportunity.convertedProjectId}`}
              className="btn-primary"
            >
              {opportunity.convertedProjectId?.projectNo
                ? `Open ${opportunity.convertedProjectId.projectNo}`
                : 'Open Project'}
            </Link>
          )}
          {canDelete && (
            <button type="button" onClick={() => setShowDeleteModal(true)} className="btn-danger">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <Link href="/opportunities" className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Workflow control ── */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Request Workflow</h2>
          </div>
          <StatusBadge status={opportunity.status} />
        </div>

        <div className="border-b border-border/60 px-5 py-2.5">
          <StageTrack
            stages={[...OPPORTUNITY_STAGE_TRACK]}
            currentStage={opportunity.status === 'rejected' ? 'feasibility_in_progress' : opportunity.status}
            variant={opportunity.status === 'rejected' ? 'rejected' : undefined}
          />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x lg:divide-border/60">
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-muted">Next step</p>
            <h3 className="mt-1 text-base font-semibold text-fg">{nextStep.title}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-fg-secondary">{nextStep.body}</p>
            {activeWorkflowMeta && (
              <p className="mt-2 text-xs text-fg-muted">
                Current status: <span className="font-semibold text-fg-secondary">{activeWorkflowMeta.title}</span> - {activeWorkflowMeta.description}
              </p>
            )}

            {workflowError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-400">
                {workflowError}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {canSubmitDraft && (
                <button
                  type="button"
                  onClick={() => void changeStatus('new', 'new')}
                  disabled={Boolean(workflowBusy)}
                  className="btn-primary gap-2"
                >
                  <Send className="h-4 w-4" />
                  {workflowBusy === 'new' ? 'Submitting...' : 'Submit request'}
                </button>
              )}

              {isPmRole && opportunity.status === 'new' && (
                <button
                  type="button"
                  onClick={() => void sendToReview()}
                  disabled={!canSendToReview || Boolean(workflowBusy)}
                  className="btn-primary gap-2 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {workflowBusy === 'under_review' ? 'Sending...' : 'Send to review'}
                </button>
              )}

              {canStartFeasibility && (
                <button
                  type="button"
                  onClick={() => void changeStatus('feasibility_in_progress', 'feasibility_in_progress')}
                  disabled={Boolean(workflowBusy)}
                  className="btn-primary gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  {workflowBusy === 'feasibility_in_progress' ? 'Starting...' : 'Start feasibility'}
                </button>
              )}

              {canEditReview && (
                <button
                  type="button"
                  onClick={() => void saveReviewNotes()}
                  disabled={reviewNotesEmpty || Boolean(workflowBusy)}
                  className="btn-secondary gap-2 disabled:opacity-40"
                  title={reviewNotesEmpty ? 'Add at least one note before saving' : undefined}
                >
                  <Save className="h-4 w-4" />
                  {workflowBusy === 'review_notes' ? 'Saving...' : 'Save feasibility notes'}
                </button>
              )}

              {canResolveFeasibility && (
                <>
                  <button
                    type="button"
                    onClick={() => void resolveFeasibility('approved')}
                    disabled={!reviewComplete || Boolean(workflowBusy)}
                    className="btn-primary gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {workflowBusy === 'approved' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveFeasibility('rejected')}
                    disabled={!reviewComplete || Boolean(workflowBusy)}
                    className="btn-danger gap-2 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    {workflowBusy === 'rejected' ? 'Rejecting...' : 'Reject'}
                  </button>
                </>
              )}

              {canReopen && (
                <button
                  type="button"
                  onClick={() => void changeStatus('under_review', 'under_review')}
                  disabled={Boolean(workflowBusy)}
                  className="btn-secondary gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {workflowBusy === 'under_review' ? 'Reopening...' : 'Reopen review'}
                </button>
              )}

              {opportunity.status === 'approved' && isPmRole && (
                <Link href={`/projects/new?opportunityId=${opportunity._id}`} className="btn-primary gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Convert to Project
                </Link>
              )}

              {opportunity.status === 'converted_to_project' && opportunity.convertedProjectId && (
                <Link href={`/projects/${opportunity.convertedProjectId?._id ?? opportunity.convertedProjectId}`} className="btn-primary">
                  Open Project
                </Link>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 px-5 py-4 lg:border-t-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-muted">Reviewer</p>
            <p className="mt-1 text-sm font-semibold text-fg">{reviewerNameFrom(opportunity.assignedReviewer)}</p>
            {opportunity.assignedReviewer?.email && (
              <p className="mt-0.5 text-xs text-fg-muted">{opportunity.assignedReviewer.email}</p>
            )}

            {canAssignReviewer && (
              <div className="mt-3 space-y-2">
                <select
                  value={reviewDraft.assignedReviewer}
                  onChange={(event) =>
                    setReviewDraft((current) => ({ ...current, assignedReviewer: event.target.value }))
                  }
                  className="input-field text-sm"
                  disabled={Boolean(workflowBusy)}
                >
                  <option value="">Select reviewer...</option>
                  {reviewerOptions.map((reviewer) => (
                    <option key={reviewer._id || reviewer.id} value={reviewer._id || reviewer.id}>
                      {`${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || reviewer.email}
                      {reviewer.role ? ` (${formatStatus(reviewer.role)})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void saveReviewer()}
                  disabled={!reviewDraft.assignedReviewer || Boolean(workflowBusy)}
                  className="btn-secondary w-full justify-center gap-2 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {workflowBusy === 'reviewer' ? 'Saving reviewer...' : 'Save reviewer'}
                </button>
              </div>
            )}
          </div>
        </div>

        {(canEditReview ||
          opportunity.feasibilityNotes ||
          opportunity.complexityNotes ||
          opportunity.riskNotes ||
          opportunity.budgetNotes) && (
          <div className="border-t border-border/60 px-5 py-4">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { key: 'feasibilityRating', label: 'Feasibility', options: FEASIBILITY_RATINGS },
                { key: 'complexityRating', label: 'Complexity', options: COMPLEXITY_RATINGS },
                { key: 'riskRating', label: 'Risk', options: RISK_RATINGS },
                { key: 'budgetAlignment', label: 'Budget', options: BUDGET_ALIGNMENT },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-xs font-medium text-fg-secondary">{field.label}</span>
                  <select
                    value={reviewDraft[field.key as keyof ReviewDraft]}
                    onChange={(event) =>
                      setReviewDraft((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    disabled={!canEditReview || Boolean(workflowBusy)}
                    className="input-field text-sm"
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {[
                { key: 'feasibilityNotes', label: 'Feasibility notes', placeholder: 'Technical concept, customer assumptions, pass/fail feasibility.' },
                { key: 'complexityNotes', label: 'Complexity notes', placeholder: 'Tooling, controls, variants, fixtures, utilities, long-lead concerns.' },
                { key: 'riskNotes', label: 'Risk notes', placeholder: 'Open risks, validation needs, customer dependencies, blockers.' },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-xs font-medium text-fg-secondary">
                    {field.label}
                    {['feasibilityNotes', 'complexityNotes', 'riskNotes'].includes(field.key) && (
                      <span className="ml-0.5 text-red-500">*</span>
                    )}
                  </span>
                  <textarea
                    value={reviewDraft[field.key as keyof ReviewDraft]}
                    onChange={(event) =>
                      setReviewDraft((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    disabled={!canEditReview || Boolean(workflowBusy)}
                    className="input-field min-h-[92px] resize-y text-sm"
                  />
                </label>
              ))}
            </div>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-medium text-fg-secondary">Budget notes</span>
              <textarea
                value={reviewDraft.budgetNotes}
                onChange={(event) =>
                  setReviewDraft((current) => ({ ...current, budgetNotes: event.target.value }))
                }
                placeholder="Commercial alignment, quote assumptions, cost sensitivity, or exclusions."
                disabled={!canEditReview || Boolean(workflowBusy)}
                className="input-field min-h-[72px] resize-y text-sm"
              />
            </label>
          </div>
        )}
      </div>

      {/* ── Quotes panel ── */}
      <div className="mb-5 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Quotes</h2>
            {quotes.length > 0 && (
              <span className="rounded-full bg-surface-tertiary border border-border px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                {quotes.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/quotes?opportunityId=${opportunity._id}`} className="btn-ghost px-3 py-2 text-xs">
              View All
            </Link>
            {canCreateQuote && (
              <Link
                href={`/quotes/new?opportunityId=${opportunity._id}&customerId=${opportunity.customerId?._id ?? opportunity.customerId}`}
                className="btn-secondary px-3 py-2 text-xs"
              >
                Create Quote
              </Link>
            )}
          </div>
        </div>
        {quotes.length === 0 ? (
          <div className="px-5 py-4 text-sm text-fg-muted">No commercial quotes are linked to this machine inquiry yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th>Quote</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.map((quote) => (
                  <tr key={quote._id} className="table-row">
                    <td>
                      <Link href={`/quotes/${quote._id}`} className="font-semibold text-fg hover:text-brand-600">
                        {quote.quoteNo}
                      </Link>
                    </td>
                    <td><StatusBadge status={quote.status} /></td>
                    <td className="text-fg-secondary">{formatDate(quote.validUntil)}</td>
                    <td className="text-right font-semibold text-fg">{formatMoney(quote.grandTotal, quote.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Info card ── */}
      <div className="mb-5 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60">
          {[
            { label: 'Customer',           value: opportunity.customerId?.name },
            { label: 'Machine / Vertical', value: [opportunity.machineVertical, opportunity.machineCategory, opportunity.machineType].filter(Boolean).join(' · ') || null },
            { label: 'Target Delivery',    value: formatDate(opportunity.deliveryTargetDate), highlight: true },
            { label: 'Created by',         value: opportunity.createdBy ? `${opportunity.createdBy.firstName} ${opportunity.createdBy.lastName}` : null },
          ].map(({ label, value, highlight }, i) => (
            <div key={label} className={clsx('px-5 py-3', i >= 2 ? 'hidden sm:block' : '')}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-muted mb-0.5">{label}</p>
              <p className={clsx('text-sm font-semibold truncate', highlight ? 'text-brand-600 dark:text-brand-400' : 'text-fg')}>
                {value || '—'}
              </p>
            </div>
          ))}
        </div>
        {opportunity.convertedProjectId && (
          <div className="border-t border-border/60 px-5 py-3 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-muted">Linked Project</span>
            <Link
              href={`/projects/${opportunity.convertedProjectId?._id ?? opportunity.convertedProjectId}`}
              className="font-mono text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {opportunity.convertedProjectId?.projectNo ?? 'View Project'}
            </Link>
            {opportunity.convertedProjectId?.name && (
              <span className="text-sm text-fg-secondary truncate">{opportunity.convertedProjectId.name}</span>
            )}
          </div>
        )}
      </div>

      {Array.isArray(opportunity.checklistResponses) && opportunity.checklistResponses.length > 0 && (
        <MachineChecklistCard
          opportunityId={params.id as string}
          checklistResponses={opportunity.checklistResponses}
          machineCategory={opportunity.machineCategory}
          machineVertical={opportunity.machineVertical}
          isLocked={opportunity.status === 'converted_to_project'}
          onUpdated={(updated) => setOpportunity((prev: any) => ({ ...prev, checklistResponses: updated }))}
        />
      )}

      {/* ── Main layout: tabs (left) + activity (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

        {/* Left: tabs */}
        <div>
          {/* Tab strip */}
          <div className="mb-4 flex rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'relative flex flex-1 items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors',
                  i > 0 && 'border-l border-border',
                  activeTab === tab.id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-400'
                    : 'text-fg-secondary hover:bg-surface-secondary hover:text-fg',
                )}
              >
                <tab.icon className={clsx('h-4 w-4 shrink-0', activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-fg-muted')} />
                {tab.label}
                {tab.id === 'files' && fileCount > 0 && (
                  <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {fileCount}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Discussion */}
          {activeTab === 'discussion' && (
            <div className="card p-5">
              <DiscussionBoard
                opportunityId={params.id}
                currentUserId={userId}
                users={users}
                onNoteChanged={refreshActivity}
              />
            </div>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div className="card p-5">
              <ReferencesAndPhotosPanel
                opportunityId={params.id}
                photos={opportunity.referencePhotos || []}
                attachments={localAttachments.map((a) => a.dataUrl)}
                disabled={!canEditIntake}
                onChanged={handleReferencePhotosChanged}
              />
            </div>
          )}
        </div>

        {/* Right: Activity */}
        <div className="lg:sticky lg:top-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-surface-secondary/40">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-fg-muted" />
                <h2 className="text-sm font-semibold text-fg">Activity</h2>
                {(auditEntries.length + discussionEntries.length) > 0 && (
                  <span className="rounded-full bg-surface-tertiary border border-border px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                    {auditEntries.length + discussionEntries.length}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto overscroll-contain p-4">
              <ActivityTimeline auditEntries={auditEntries} discussionEntries={discussionEntries} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <Modal title="Delete Machine Inquiry" onClose={() => !deleting && setShowDeleteModal(false)} size="md">
          <div className="space-y-4">
            <p className="text-sm text-fg-secondary">
              Delete <span className="font-semibold text-fg">{opportunity.title}</span>? This removes it from the active machine inquiry pipeline.
            </p>
            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting} className="btn-ghost">Cancel</button>
              <button type="button" onClick={() => void handleDeleteOpportunity()} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting…' : 'Delete Machine Inquiry'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
