'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronDown, HelpCircle,
  ClipboardCheck, FileInput, FolderKanban, GitBranch, Hash, LayoutDashboard,
  Lightbulb, ListChecks, Search, ShieldCheck, Users, Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { FAQ, SUPPORT_EMAIL } from '@/lib/app-meta';
import { ROLE_DEFINITIONS, roleColor, roleLabel } from '@/lib/roles';

type HelpSectionProps = {
  id: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  children: React.ReactNode;
};

function HelpSection({ id, icon: Icon, title, summary, children }: HelpSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <header className="flex items-start gap-3 border-b border-border bg-surface-secondary/45 px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          <p className="mt-0.5 text-sm text-fg-muted">{summary}</p>
        </div>
      </header>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ProductShot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface-secondary shadow-sm">
      <div className="relative aspect-[16/9] w-full bg-surface-tertiary">
        <Image src={src} alt={alt} fill sizes="(max-width: 1024px) 100vw, 760px" className="object-cover object-top" />
      </div>
      <figcaption className="flex items-start gap-2 border-t border-border px-4 py-3 text-xs leading-relaxed text-fg-muted">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        {caption}
      </figcaption>
    </figure>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold', roleColor(role))}>
      {roleLabel(role)}
    </span>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-semibold text-fg transition-colors hover:text-brand-600"
      >
        {question}
        <ChevronDown className={clsx('h-4 w-4 shrink-0 text-fg-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="pb-4 pr-8 text-sm leading-relaxed text-fg-secondary">{answer}</p>}
    </div>
  );
}

const SECTIONS = [
  { id: 'start', label: 'Start here', icon: LayoutDashboard },
  { id: 'workflow', label: 'Machine Inquiry workflow', icon: GitBranch },
  { id: 'intake', label: 'Intake and review', icon: ClipboardCheck },
  { id: 'delivery', label: 'Project delivery', icon: FolderKanban },
  { id: 'roles', label: 'Roles and access', icon: ShieldCheck },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

const STAGES = [
  ['Draft', 'Capture scope', 'bg-slate-100 text-slate-700'],
  ['New', 'Submitted', 'bg-sky-100 text-sky-700'],
  ['Under Review', 'Reviewer assigned', 'bg-amber-100 text-amber-700'],
  ['Feasibility', 'Assess risk', 'bg-orange-100 text-orange-700'],
  ['Approved', 'Ready to convert', 'bg-emerald-100 text-emerald-700'],
  ['Converted', 'Project created', 'bg-indigo-100 text-indigo-700'],
] as const;

const TRANSITIONS = [
  ['Draft → New', 'Sales, Manager, Admin', 'Save the intake first'],
  ['New → Under Review', 'Manager, Admin', 'Assign a reviewer'],
  ['Under Review → Feasibility', 'Assigned reviewer, Manager, Admin', 'Start the technical assessment'],
  ['Feasibility → Approved', 'Manager, Admin', 'Complete feasibility, complexity, and risk notes'],
  ['Feasibility → Rejected', 'Manager, Admin', 'Record the decision in the discussion or review'],
  ['Approved → Converted', 'Manager, Admin', 'Choose a project manager and confirm project details'],
] as const;

const ROLE_FOCUS: Record<string, string> = {
  admin: 'Configuration, users, all workflows, and controlled procurement updates.',
  manager: 'Review gates, project conversion, delivery planning, and team coordination.',
  sales: 'Customer records, machine inquiry intake, references, and customer follow-up.',
  designer: 'Assigned reviews, machines, components, engineering tasks, and deliverables.',
  leadership: 'Read-only oversight of pipeline, project health, risks, and procurement status.',
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl pb-10">
      <PageHeader
        title="Help Center"
        description="Visual, role-aware guidance for the work you do in MachineIQ."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: FileInput, title: 'Create a machine inquiry', text: 'Capture a machine request and submit it for review.', href: '/opportunities/new' },
          { icon: FolderKanban, title: 'Open project delivery', text: 'Track machines, tasks, components, and blockers.', href: '/projects' },
          { icon: Search, title: 'Find an answer', text: 'Jump to concise answers for common access and workflow issues.', href: '#faq' },
        ].map(({ icon: Icon, title, text, href }) => (
          <Link key={title} href={href} className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/30">
                <Icon className="h-4 w-4" />
              </span>
              <ArrowRight className="h-4 w-4 text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </div>
            <p className="mt-3 text-sm font-bold text-fg">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">{text}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 rounded-xl border border-border bg-surface p-3 shadow-sm" aria-label="Help topics">
            <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-muted">On this page</p>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-fg-secondary transition hover:bg-surface-secondary hover:text-fg">
                <Icon className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <HelpSection id="start" icon={LayoutDashboard} title="Start with your workspace" summary="The dashboard and navigation adapt to your assigned role.">
            <ProductShot
              src="/help/dashboard-overview.jpg"
              alt="MachineIQ dashboard showing role-aware metrics, project health, and navigation"
              caption="Use the left navigation for modules, the bell for notifications, and the top-right profile menu for your profile, theme, and sign out. Dashboard cards lead directly to the work behind each metric."
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['1', 'Check attention items', 'Start with overdue work, blockers, or machine inquiries waiting at a gate.'],
                ['2', 'Open the record', 'Use a card, table row, or navigation item to enter the detailed workspace.'],
                ['3', 'Record the outcome', 'Update status, notes, ownership, or the relevant deliverable so the next person has context.'],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-xl border border-border p-4">
                  <span className="text-xs font-bold text-brand-600">STEP {number}</span>
                  <p className="mt-1 text-sm font-semibold text-fg">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{text}</p>
                </div>
              ))}
            </div>
          </HelpSection>

          <HelpSection id="workflow" icon={GitBranch} title="Move a machine inquiry through review" summary="Each gate has a clear owner and prerequisite; stages cannot be skipped.">
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max items-start gap-2">
                {STAGES.map(([label, detail, style], index) => (
                  <div key={label} className="flex items-start gap-2">
                    <div className="w-24 text-center">
                      <span className={clsx('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', style)}>{label}</span>
                      <p className="mt-1.5 text-[10px] text-fg-muted">{detail}</p>
                    </div>
                    {index < STAGES.length - 1 && <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-fg-muted" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-surface-secondary text-xs uppercase tracking-wide text-fg-muted">
                  <tr><th className="px-4 py-3">Move</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Before you move it</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {TRANSITIONS.map(([move, who, condition]) => (
                    <tr key={move}><td className="px-4 py-3 font-semibold text-fg">{move}</td><td className="px-4 py-3 text-fg-secondary">{who}</td><td className="px-4 py-3 text-fg-secondary">{condition}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs leading-relaxed text-brand-800 dark:border-brand-900/50 dark:bg-brand-950/20 dark:text-brand-200">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
              Rejected work is not lost. A Manager or Admin can reopen it at Under Review when new information arrives.
            </p>
          </HelpSection>

          <HelpSection id="intake" icon={ClipboardCheck} title="Create a useful intake and review" summary="Capture decision-grade information, not just enough fields to save.">
            <ProductShot
              src="/help/opportunity-intake.jpg"
              alt="MachineIQ machine inquiry intake form with machine, performance, constraints, and checklist steps"
              caption="Work across the four intake steps. Save whenever you need to pause; submit only when another person can understand the machine purpose, expected performance, constraints, and open dependencies."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Wrench, title: 'Machine', text: 'Build type, vertical, category, work object, process, layout, and automation.' },
                { icon: ListChecks, title: 'Performance', text: 'Cycle time, output, accuracy, quality checks, priority, and delivery target.' },
                { icon: ShieldCheck, title: 'Constraints', text: 'Environment, utilities, available space, standards, budget, and integration.' },
                { icon: CheckCircle2, title: 'Review readiness', text: 'Drawings, site visit, critical specifications, dependencies, and unresolved questions.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3 rounded-xl border border-border p-4">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <div><p className="text-sm font-semibold text-fg">{title}</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">{text}</p></div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Good review notes</p>
                <p className="mt-2 text-sm text-emerald-900 dark:text-emerald-100">State assumptions, evidence, complexity drivers, risks, owners, and the next action.</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Keep questions visible</p>
                <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">Use an open Question in Discussions when missing customer input could change scope or approval.</p>
              </div>
            </div>
          </HelpSection>

          <HelpSection id="delivery" icon={FolderKanban} title="Run project delivery from one workspace" summary="Conversion carries the commercial context into structured engineering execution.">
            <ProductShot
              src="/help/project-workspace.jpg"
              alt="MachineIQ project workspace showing project summary and delivery controls"
              caption="Use the project workspace as the source of truth. Break the machine into systems, assign tasks and owners, link components and deliverables, then release clean information to procurement."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Machine structure', 'Define machines, units, modules, controls, and components.'],
                ['Tasks and deliverables', 'Assign accountable owners, dates, status, and review outputs.'],
                ['Documents and decisions', 'Preserve the evidence and rationale behind technical choices.'],
                ['Procurement readiness', 'Release components only when design information is complete.'],
                ['Milestones and health', 'Keep delivery dates, risks, and blockers visible to managers.'],
                ['Activity history', 'Use the audit trail instead of relying on memory or private messages.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-border p-4"><p className="text-sm font-semibold text-fg">{title}</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">{text}</p></div>
              ))}
            </div>
          </HelpSection>

          <HelpSection id="roles" icon={Users} title="Know what each role owns" summary="The interface hides unavailable actions; the API enforces the same permissions.">
            <div className="overflow-hidden rounded-xl border border-border">
              {ROLE_DEFINITIONS.map((role) => (
                <div key={role.key} className="grid gap-2 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[120px_1fr] sm:items-start">
                  <div><RoleBadge role={role.key} /></div>
                  <div>
                    <p className="text-sm text-fg-secondary">{ROLE_FOCUS[role.key]}</p>
                    <p className="mt-1 text-xs text-fg-muted">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-fg-muted">Your current role appears in the top-right profile menu. Only an Admin can change user roles.</p>
          </HelpSection>

          <HelpSection id="faq" icon={BookOpen} title="Frequently asked questions" summary="Short answers to the issues most likely to interrupt work.">
            <div className="grid gap-x-6 lg:grid-cols-2">
              {FAQ.map((group) => (
                <div key={group.id}>
                  <h3 className="border-b border-border pb-2 text-xs font-bold uppercase tracking-[0.12em] text-fg-muted">{group.label}</h3>
                  {group.items.map((item) => <FaqItem key={item.q} question={item.q} answer={item.a} />)}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-fg">Still blocked?</p>
                <p className="mt-0.5 text-xs text-fg-muted">Include the page, record number, expected result, and a screenshot when you report an issue.</p>
              </div>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-secondary shrink-0">Email support</a>
            </div>
          </HelpSection>

          <div className="flex items-center justify-center gap-2 pb-2 text-xs text-fg-muted">
            <Hash className="h-3.5 w-3.5" /> REQ and PRJ references are the fastest way to identify a record.
          </div>
        </div>
      </div>
    </div>
  );
}
