'use client';

import Link from 'next/link';
import {
  Tag, Sparkles, ExternalLink, FlaskConical, Mail,
  Grid3X3, Users, Eye, ArrowRightLeft, ListOrdered, BarChart2,
  Building2, FileInput, LayoutDashboard, UserCog,
  Factory, Link2, ShieldCheck,
  UserCheck, PackageCheck, FolderKanban, ListTodo, Wrench, FileText,
} from 'lucide-react';
import {
  APP_NAME, APP_BY, APP_VERSION, BUILD_TIME, RELEASE_CHANNEL,
  SUPPORT_EMAIL,
} from '@/lib/app-meta';

function fmtDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── pipeline diagram ─────────────────────────────────── */
const PIPELINE = [
  { icon: Building2,     label: 'Customer',    color: 'text-sky-400'     },
  { icon: FileInput,     label: 'Machine Inquiry', color: 'text-amber-400'   },
  { icon: ListOrdered,   label: 'Project',     color: 'text-violet-400'  },
  { icon: UserCog,       label: 'Engineering', color: 'text-emerald-400' },
  { icon: PackageCheck,  label: 'Procurement', color: 'text-rose-400'    },
];

/* ── problem items ────────────────────────────────────── */
const PROBLEMS = [
  {
    icon: Grid3X3,
    title: 'Work scattered everywhere',
    desc: 'OEM machine orders spawn dozens of engineering tasks tracked across spreadsheets, emails, and whiteboards.',
  },
  {
    icon: Users,
    title: 'Teams operate in silos',
    desc: 'Sales, engineering, and procurement hand-offs are manual, inconsistent, and error-prone.',
  },
  {
    icon: Eye,
    title: 'No single source of truth',
    desc: 'No clear view of project status, procurement readiness, or blocked tasks.',
  },
];

/* ── solution items ───────────────────────────────────── */
const SOLUTIONS = [
  {
    icon: ArrowRightLeft,
    title: 'One platform. End-to-end flow.',
    desc: 'Connect sales intake → engineering execution → procurement release in a single structured pipeline.',
  },
  {
    icon: ListOrdered,
    title: 'Structured by design',
    desc: 'Customer → Machine Inquiry → Project → Tasks → Procurement with built-in governance.',
  },
  {
    icon: BarChart2,
    title: 'Real-time visibility',
    desc: 'Live status, blockers, and escalations — visible to the right people at the right time.',
  },
];

/* ── pillars ──────────────────────────────────────────── */
const PILLARS = [
  {
    icon: Factory,
    color: 'text-violet-400 bg-violet-500/10',
    title: 'Built for OEM',
    desc: 'Every concept — MBS, Feasibility, FAT/SAT — maps directly to how OEM builders work. Not a generic project management tool.',
  },
  {
    icon: Link2,
    color: 'text-sky-400 bg-sky-500/10',
    title: 'One handoff chain',
    desc: 'From sales inquiry to procurement release, nothing falls through the gap between teams.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-400 bg-emerald-500/10',
    title: 'Audit-ready from day one',
    desc: 'Every decision, status change, and release is logged with who did it and when. No more "who approved this?"',
  },
];

/* ── outcome items ────────────────────────────────────── */
const OUTCOMES = [
  {
    icon: UserCheck,
    color: 'text-sky-400 bg-sky-500/10',
    title: 'Engineering knows what\'s coming',
    desc: 'Before sales closes the deal.',
  },
  {
    icon: PackageCheck,
    color: 'text-emerald-400 bg-emerald-500/10',
    title: 'Procurement gets clean releases',
    desc: 'With full design context — no back-and-forth.',
  },
  {
    icon: BarChart2,
    color: 'text-violet-400 bg-violet-500/10',
    title: 'Leadership has a live snapshot',
    desc: 'No status meetings needed.',
  },
];

/* ── active modules ───────────────────────────────────── */
const MODULES = [
  { icon: LayoutDashboard, label: 'Dashboard',     desc: 'Role-aware snapshot'   },
  { icon: Building2,        label: 'Customers',     desc: 'OEM customer master'   },
  { icon: FileInput,        label: 'Machine Inquiries', desc: 'Inquiry to approval' },
  { icon: FolderKanban,     label: 'Projects',      desc: 'Delivery workspace' },
  { icon: ListTodo,         label: 'Tasks',         desc: 'Assigned work' },
  { icon: Wrench,           label: 'Machines',      desc: 'Machine breakdown' },
  { icon: PackageCheck,     label: 'Procurement',   desc: 'Release readiness' },
  { icon: FileText,         label: 'Documents',     desc: 'Project records' },
  { icon: Users,            label: 'Users',         desc: 'Admin management' },
];

/* ── section header ───────────────────────────────────── */
function SectionHeader({ icon: Icon, label, iconClass }: { icon: React.ElementType; label: string; iconClass: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-fg-muted">{label}</span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-10">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-brand-950/20 p-6">
        {/* Identity row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white shadow">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-fg leading-none">{APP_NAME}</p>
            <p className="mt-0.5 text-[11px] text-fg-muted">ERP for machine builders &middot; by {APP_BY}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 font-mono text-xs font-bold text-brand-700 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300">
              <Tag className="h-3 w-3" />{RELEASE_CHANNEL} · v{APP_VERSION}
            </span>
            <Link
              href="/about/release-notes"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-fg-secondary transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              <Sparkles className="h-3 w-3" /> What&apos;s New
            </Link>
          </div>
        </div>

        {/* Tagline + diagram */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
              One platform. Every handoff. Zero gaps.
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">
              From sales intake to machine delivery — fully connected, fully traceable, audit-ready.
            </p>
          </div>

          {/* Pipeline diagram */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {PIPELINE.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-1 sm:gap-1.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface/80 shadow-sm ${step.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="hidden text-[9px] font-semibold text-fg-muted sm:block leading-none">{step.label}</span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <span className="text-[10px] font-bold text-fg-muted pb-2.5">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RELEASE STATUS ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-fg">Currently in {RELEASE_CHANNEL}</p>
          <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
            Core workflows are ready for controlled team use. Validate your process and permissions before a company-wide rollout, and report anything that blocks real work.
          </p>
        </div>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-secondary shrink-0">
          <Mail className="h-4 w-4" /> Report feedback
        </a>
      </div>

      {/* ── PROBLEM / SOLUTION ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Problem */}
        <div className="rounded-2xl border border-red-200/60 bg-surface p-5 dark:border-red-900/40">
          <SectionHeader icon={Grid3X3} label="The Problem" iconClass="text-red-500" />
          <div className="space-y-3.5">
            {PROBLEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                    <Icon className="h-3.5 w-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-fg">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Solution */}
        <div className="rounded-2xl border border-brand-200/60 bg-surface p-5 dark:border-brand-900/40">
          <SectionHeader icon={ArrowRightLeft} label="The Solution" iconClass="text-brand-500" />
          <div className="space-y-3.5">
            {SOLUTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30">
                    <Icon className="h-3.5 w-3.5 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-fg">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── WHY DIFFERENT ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <SectionHeader icon={Factory} label="Why MachineIQ is Different" iconClass="text-violet-500" />
        <div className="grid gap-3 sm:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="rounded-xl border border-border bg-surface-secondary/40 p-4">
                <div className={`mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg ${p.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-fg">{p.title}</p>
                <p className="mt-1 text-[11px] leading-snug text-fg-muted">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── THE OUTCOME ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-200/60 bg-surface p-5 dark:border-emerald-900/40">
        <SectionHeader icon={UserCheck} label="The Outcome" iconClass="text-emerald-500" />
        <div className="grid gap-3 sm:grid-cols-3">
          {OUTCOMES.map((o) => {
            const Icon = o.icon;
            return (
              <div key={o.title} className="rounded-xl border border-border bg-surface-secondary/40 p-4">
                <div className={`mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg ${o.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-fg">{o.title}</p>
                <p className="mt-1 text-[11px] leading-snug text-fg-muted">{o.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE MODULES ──────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary/50 px-4 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-fg-muted">Active modules</span>
          <span className="font-mono text-[11px] text-fg-muted">v{APP_VERSION}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex flex-col items-center gap-1.5 border-b border-r border-border px-3 py-4 last:border-r-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-fg-secondary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-semibold text-fg text-center leading-tight">{m.label}</p>
                <p className="text-[10px] text-fg-muted text-center leading-tight">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600/10">
            <span className="text-xs font-bold text-brand-600">Q</span>
          </div>
          <div>
            <p className="text-xs font-bold text-fg">Built by {APP_BY}</p>
            <p className="text-[11px] text-fg-muted">A product &amp; engineering studio building focused software for complex industrial workflows.</p>
            {BUILD_TIME && <p className="mt-0.5 text-[10px] text-fg-muted">Build: {fmtDate(BUILD_TIME)}</p>}
          </div>
        </div>
        <a
          href="https://www.quorintech.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          www.quorintech.com <ExternalLink className="h-3 w-3" />
        </a>
      </div>

    </div>
  );
}
