'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import {
  AlertTriangle, ArrowDown, ArrowRight, BookOpen, Boxes, Building2, CheckCircle2,
  ChevronDown, CircleDollarSign, ClipboardCheck, ClipboardList, FileCheck2,
  GitBranch, HelpCircle, LayoutDashboard, MessageCircle, PackageCheck, Search, Send,
  Settings, ShieldCheck, UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { FAQ, SUPPORT_EMAIL } from '@/lib/app-meta';
import { glossary, type GlossaryEntry } from '@/lib/glossary';

type View = 'setup' | 'sales' | 'handover' | 'faq' | 'glossary';
type Step = {
  title: string;
  short: string;
  description: string;
  checklist: readonly string[];
  href: string;
  action: string;
  icon: React.ElementType;
};

const VIEWS: { key: View; label: string; description: string; icon: React.ElementType }[] = [
  { key: 'setup', label: 'Set up MachineIQ', description: 'Administrator starting point', icon: Settings },
  { key: 'sales', label: 'Run the sales flow', description: 'Enquiry to machine project', icon: ClipboardList },
  { key: 'handover', label: 'Start R3 engineering', description: 'Commercial-to-engineering handover', icon: GitBranch },
  { key: 'faq', label: 'FAQ', description: 'Common questions and support', icon: HelpCircle },
  { key: 'glossary', label: 'Glossary', description: 'Understand MachineIQ terms', icon: BookOpen },
];

type GlossaryKey = keyof typeof glossary;
const GLOSSARY_GROUPS: { key: string; label: string; keys: readonly GlossaryKey[] }[] = [
  { key: 'core', label: 'Core & setup', keys: ['masterData', 'foundationMaster', 'activeRecord', 'softDelete', 'auditTrail', 'role', 'permission', 'documentType', 'numberingSeries', 'referenceStatus', 'employeeIdentity', 'uom'] },
  { key: 'sales', label: 'Sales', keys: ['enquiry', 'qualification', 'customerSite', 'quotation', 'quotationRevision', 'approver', 'customerAcceptance', 'salesOrder', 'paymentMilestone', 'projectIntake', 'machineProject', 'commercialBaseline'] },
  { key: 'engineering', label: 'Engineering', keys: ['machine', 'module', 'component', 'deliverable', 'controlledDocument', 'engineeringRevision', 'engineeringRelease', 'decision', 'task', 'blocker', 'longLeadItem', 'bom', 'makeBuy'] },
  { key: 'supply', label: 'Inventory & purchasing', keys: ['warehouse', 'reorderLevel', 'procurement', 'purchaseRequest', 'rfq', 'purchaseOrder', 'grn', 'stockTransfer', 'stockAdjustment', 'cycleCount'] },
  { key: 'production', label: 'Production & quality', keys: ['workOrder', 'routing', 'workCenter', 'ncr', 'fat'] },
  { key: 'finance', label: 'Finance & people', keys: ['invoice', 'generalLedger', 'costCenter', 'fiscalYear', 'attendance'] },
  { key: 'statutory', label: 'Statutory & tax', keys: ['gstin', 'pan', 'panPersonal', 'tan', 'cin', 'din', 'msme', 'moa', 'aoa', 'aadhaar', 'shareholding', 'hsn', 'sac', 'taxRegistration'] },
];

const SETUP_STEPS: Step[] = [
  {
    title: 'Organization', short: 'Define where work happens', icon: Building2, href: '/organization', action: 'Open Organization',
    description: 'Create the parent structure first so every later record has a valid home.',
    checklist: ['Company legal and statutory profile', 'Operating branches', 'Physical locations', 'Departments'],
  },
  {
    title: 'Foundation & access', short: 'Define people and controls', icon: ShieldCheck, href: '/admin/settings?tab=foundation', action: 'Open Foundation settings',
    description: 'Complete shared operational references, then give active users only the access they need.',
    checklist: ['Warehouses and employees', 'Currencies, tax rates and statuses', 'Roles and permissions', 'Users linked to roles and departments'],
  },
  {
    title: 'Business masters', short: 'Create reusable records', icon: Boxes, href: '/items', action: 'Open Item master',
    description: 'Create the records that sales and engineering select instead of retyping information.',
    checklist: ['Customers and customer sites', 'Suppliers and commercial terms', 'Item categories and units of measure', 'Items, prices, costs and planning defaults'],
  },
  {
    title: 'Controls & validation', short: 'Prove the workspace is ready', icon: ClipboardCheck, href: '/sales?kind=enquiry', action: 'Start validation enquiry',
    description: 'Finish numbering and sales policy, then prove the intended roles can complete the connected flow.',
    checklist: ['Document numbering', 'Sales prefixes, currency, tax and approver rule', 'Representative role sign-in checks', 'One enquiry through to machine project'],
  },
];

const SALES_STEPS: Step[] = [
  {
    title: 'Enquiry', short: 'Capture customer demand', icon: ClipboardList, href: '/sales?kind=enquiry', action: 'Open Enquiries',
    description: 'Record the customer, site, machine, quantity, target date and complete requirement summary.',
    checklist: ['Intended use and performance', 'Interfaces and utilities', 'Constraints and standards', 'Customer-provided items and evidence'],
  },
  {
    title: 'Quotation', short: 'Agree the controlled offer', icon: CircleDollarSign, href: '/sales?kind=quote', action: 'Open Quotations',
    description: 'Qualify the enquiry, build the technical-commercial offer and obtain independent approval when configured.',
    checklist: ['Scope, exclusions and warranty', 'Price, tax, validity and delivery', 'Terms and payment milestones', 'Approval, customer decision and revisions'],
  },
  {
    title: 'Sales order', short: 'Confirm the commitment', icon: FileCheck2, href: '/sales?kind=order', action: 'Open Sales Orders',
    description: 'Create the order from the accepted quotation without re-entry, record the customer PO and approve it.',
    checklist: ['Accepted quotation source retained', 'Customer PO recorded', 'Commercial values and milestones preserved', 'Internal order approval completed'],
  },
  {
    title: 'Machine project', short: 'Create the delivery baseline', icon: PackageCheck, href: '/sales?kind=project', action: 'Open Machine Projects',
    description: 'Initiate the project from the confirmed order with ownership, dates and an immutable commercial baseline.',
    checklist: ['Project owner and dates', 'Customer site and machine category', 'Order/source traceability', 'Baseline ready for R3 engineering'],
  },
];

const HANDOVER_STEPS: Step[] = [
  {
    title: 'R2 supplies', short: 'Approved commercial truth', icon: FileCheck2, href: '/sales?kind=project', action: 'Review Machine Projects',
    description: 'The machine project carries the accepted order into engineering as a traceable baseline.',
    checklist: ['Customer, site and machine category', 'Scope, dates and contract value', 'Milestones and source documents', 'Named project owner'],
  },
  {
    title: 'R3 controls', short: 'Engineering execution', icon: GitBranch, href: '/projects', action: 'Open Projects',
    description: 'Engineering plans and releases work against the baseline without silently rewriting commercial history.',
    checklist: ['Engineering ownership and plan', 'Deliverables and controlled documents', 'Revisions, reviews and approval evidence', 'Release readiness and change traceability'],
  },
  {
    title: 'R4 receives', short: 'Released engineering demand', icon: Boxes, href: '/projects', action: 'Review project structure',
    description: 'Only controlled engineering output proceeds into BOM and material planning.',
    checklist: ['Approved machine structure', 'Released components and documents', 'Traceable engineering revision', 'Clear change and availability boundary'],
  },
];

const ROLE_PATHS = [
  { label: 'Administrator', icon: ShieldCheck, text: 'Complete setup and access', href: '/dashboard' },
  { label: 'Sales', icon: Send, text: 'Start with an enquiry', href: '/sales?kind=enquiry' },
  { label: 'Approver', icon: CheckCircle2, text: 'Review submitted quotations', href: '/sales?kind=quote' },
  { label: 'Engineer', icon: UserRound, text: 'Open assigned projects', href: '/projects' },
  { label: 'Leadership', icon: LayoutDashboard, text: 'Review reports and attention', href: '/sales?tab=reports' },
] as const;

function Journey({ steps, active, onSelect }: { steps: Step[]; active: number; onSelect: (index: number) => void }) {
  const selected = steps[active];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center" aria-label="Flow stages">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === active;
          return (
            <div key={step.title} className="contents">
              <button type="button" aria-current={isActive ? 'step' : undefined} onClick={() => onSelect(index)} className={clsx('group flex min-h-[72px] flex-1 items-center gap-3 rounded-xl border p-3 text-left transition', isActive ? 'border-brand-400 bg-brand-50 shadow-sm dark:border-brand-700 dark:bg-brand-950/30' : 'border-border bg-surface hover:border-brand-300 hover:bg-surface-secondary')}>
                <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-brand-600 text-white' : 'bg-surface-secondary text-fg-muted group-hover:text-brand-600')}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted">Step {index + 1}</span><span className="block text-sm font-semibold text-fg">{step.title}</span><span className="hidden text-[11px] text-fg-muted xl:block">{step.short}</span></span>
              </button>
              {index < steps.length - 1 && <><ArrowDown className="mx-auto h-4 w-4 shrink-0 text-brand-500 lg:hidden" /><ArrowRight className="hidden h-4 w-4 shrink-0 text-brand-500 lg:block" /></>}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-surface-secondary/45 p-5 md:grid-cols-[1fr_1.15fr] md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Step {active + 1} of {steps.length}</p>
          <h2 className="mt-1 text-xl font-bold text-fg">{selected.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{selected.description}</p>
          <Link href={selected.href} className="btn-primary mt-4 inline-flex">{selected.action}<ArrowRight className="h-4 w-4" /></Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {selected.checklist.map((item) => <li key={item} className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs text-fg-secondary"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{item}</li>)}
        </ul>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-semibold text-fg hover:text-brand-600">{question}<ChevronDown className={clsx('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} /></button>
      {open && <p className="pb-4 pr-6 text-sm leading-relaxed text-fg-secondary">{answer}</p>}
    </div>
  );
}

export default function HelpPage() {
  const [view, setView] = useState<View>('setup');
  const [setupStep, setSetupStep] = useState(0);
  const [salesStep, setSalesStep] = useState(0);
  const [handoverStep, setHandoverStep] = useState(0);
  const [faqGroup, setFaqGroup] = useState(FAQ[0].id);
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [glossaryGroup, setGlossaryGroup] = useState('core');
  const [glossaryTerm, setGlossaryTerm] = useState<GlossaryKey>('masterData');
  const selectedFaq = FAQ.find((group) => group.id === faqGroup) ?? FAQ[0];
  const normalizedQuery = glossaryQuery.trim().toLowerCase();
  const selectedGlossaryGroup = GLOSSARY_GROUPS.find((group) => group.key === glossaryGroup) ?? GLOSSARY_GROUPS[0];
  const glossaryEntries: [GlossaryKey, GlossaryEntry][] = (normalizedQuery
    ? (Object.entries(glossary) as [GlossaryKey, GlossaryEntry][]).filter(([, entry]) => `${entry.full} ${entry.description}`.toLowerCase().includes(normalizedQuery))
    : selectedGlossaryGroup.keys.map((key) => [key, glossary[key]] as [GlossaryKey, GlossaryEntry]))
    .sort((left, right) => left[1].full.localeCompare(right[1].full));
  const displayedGlossaryKey = glossaryEntries.some(([key]) => key === glossaryTerm) ? glossaryTerm : glossaryEntries[0]?.[0];
  const displayedGlossaryEntry: GlossaryEntry | null = displayedGlossaryKey ? glossary[displayedGlossaryKey] : null;

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <PageHeader title="Help & FAQ" description="Choose what you want to do, then follow one clear path." />

      <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" role="tablist" aria-label="Help journeys">
        {VIEWS.map(({ key, label, description, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)} className={clsx('flex items-center gap-3 rounded-xl border p-3 text-left transition', view === key ? 'border-brand-400 bg-brand-50 shadow-sm dark:border-brand-700 dark:bg-brand-950/30' : 'border-border bg-surface hover:border-brand-300 hover:bg-surface-secondary')}>
            <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', view === key ? 'bg-brand-600 text-white' : 'bg-surface-secondary text-fg-muted')}><Icon className="h-4 w-4" /></span>
            <span><span className="block text-sm font-semibold text-fg">{label}</span><span className="block text-[11px] text-fg-muted">{description}</span></span>
          </button>
        ))}
      </div>

      <section className="card p-4 sm:p-5" role="tabpanel">
        {view === 'setup' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><span className="badge-blue">Release 1 foundation</span><h1 className="mt-2 text-lg font-bold text-fg">Set up once, in dependency order</h1><p className="mt-1 text-sm text-fg-muted">Select a stage to see only what you need now.</p></div><Link href="/dashboard" className="text-sm font-semibold text-brand-600 hover:underline">View setup readiness →</Link></div>
            <Journey steps={SETUP_STEPS} active={setupStep} onSelect={setSetupStep} />
            <div className="border-t border-border pt-4"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-fg-muted">Take me to my work</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{ROLE_PATHS.map(({ label, text, href, icon: Icon }) => <Link key={label} href={href} className="group flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 hover:border-brand-300 hover:bg-surface-secondary"><Icon className="h-4 w-4 shrink-0 text-brand-600" /><span className="min-w-0"><span className="block text-xs font-semibold text-fg">{label}</span><span className="block truncate text-[10px] text-fg-muted">{text}</span></span></Link>)}</div></div>
          </div>
        )}

        {view === 'sales' && (
          <div className="space-y-5">
            <div><span className="badge-green">Release 2 live</span><h1 className="mt-2 text-lg font-bold text-fg">From customer demand to machine project</h1><p className="mt-1 text-sm text-fg-muted">Every stage retains its source, approval and revision history.</p></div>
            <Journey steps={SALES_STEPS} active={salesStep} onSelect={setSalesStep} />
            <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2"><div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><strong>Returned internally:</strong> correct the draft and submit it again with the return reason retained.</div><div className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 dark:bg-blue-950/20 dark:text-blue-100"><strong>Customer requests changes:</strong> create a new quotation revision; never overwrite an approved version.</div></div>
          </div>
        )}

        {view === 'handover' && (
          <div className="space-y-5">
            <div><span className="badge-blue">R3 starting point</span><h1 className="mt-2 text-lg font-bold text-fg">Commercial truth becomes controlled engineering work</h1><p className="mt-1 text-sm text-fg-muted">Select a release boundary to understand what enters and leaves it.</p></div>
            <Journey steps={HANDOVER_STEPS} active={handoverStep} onSelect={setHandoverStep} />
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Keep the baseline intact.</strong> If commercial scope changes after project initiation, record a controlled change instead of editing history.</span></p>
          </div>
        )}

        {view === 'faq' && (
          <div className="space-y-5">
            <div><span className="badge-gray">Quick answers</span><h1 className="mt-2 text-lg font-bold text-fg">Choose a topic</h1></div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="FAQ categories">{FAQ.map((group) => <button key={group.id} type="button" role="tab" aria-selected={faqGroup === group.id} onClick={() => setFaqGroup(group.id)} className={clsx('rounded-full border px-3 py-1.5 text-xs font-semibold transition', faqGroup === group.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-border bg-surface text-fg-secondary hover:border-brand-300')}>{group.label}</button>)}</div>
            <div className="rounded-xl border border-border px-4">{selectedFaq.items.map((item) => <FaqItem key={item.q} question={item.q} answer={item.a} />)}</div>
            <div className="flex flex-col gap-3 rounded-xl bg-surface-secondary p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-fg">Still blocked?</p><p className="mt-0.5 text-xs text-fg-muted">Report it from the affected screen so page and browser context are included.</p></div><div className="flex gap-2"><Link href="/feedback" className="btn-primary"><MessageCircle className="h-4 w-4" />Feedback</Link><a href={`mailto:${SUPPORT_EMAIL}`} className="btn-secondary"><BookOpen className="h-4 w-4" />Email support</a></div></div>
          </div>
        )}

        {view === 'glossary' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="badge-gray">{Object.keys(glossary).length} explained terms</span><h1 className="mt-2 text-lg font-bold text-fg">MachineIQ glossary</h1><p className="mt-1 text-sm text-fg-muted">Browse by work area or search across the complete R1–R10 terminology.</p></div><label className="relative block sm:w-80"><span className="sr-only">Search glossary</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" /><input className="input-field pl-9" value={glossaryQuery} onChange={(event) => setGlossaryQuery(event.target.value)} placeholder="Search terms and descriptions" /></label></div>
            <div className="flex flex-wrap gap-2" aria-label="Glossary categories">{GLOSSARY_GROUPS.map((group) => <button key={group.key} type="button" onClick={() => { setGlossaryGroup(group.key); setGlossaryQuery(''); setGlossaryTerm(group.keys[0]); }} className={clsx('rounded-full border px-3 py-1.5 text-xs font-semibold transition', !normalizedQuery && glossaryGroup === group.key ? 'border-brand-600 bg-brand-600 text-white' : 'border-border bg-surface text-fg-secondary hover:border-brand-300')}>{group.label}<span className={clsx('ml-1.5', !normalizedQuery && glossaryGroup === group.key ? 'text-brand-100' : 'text-fg-muted')}>{group.keys.length}</span></button>)}</div>
            <div className="grid min-h-[360px] overflow-hidden rounded-xl border border-border md:grid-cols-[minmax(220px,.7fr)_1.3fr]">
              <div className="max-h-[420px] overflow-y-auto border-b border-border bg-surface-secondary/45 p-2 md:border-b-0 md:border-r">
                <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-fg-muted">{normalizedQuery ? `${glossaryEntries.length} search result${glossaryEntries.length === 1 ? '' : 's'}` : selectedGlossaryGroup.label}</p>
                {glossaryEntries.map(([key, entry]) => <button key={key} type="button" onClick={() => setGlossaryTerm(key)} className={clsx('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition', displayedGlossaryKey === key ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' : 'text-fg-secondary hover:bg-surface hover:text-fg')}><span>{entry.full}</span><ArrowRight className="h-3.5 w-3.5 shrink-0" /></button>)}
                {!glossaryEntries.length && <div className="p-6 text-center"><BookOpen className="mx-auto h-5 w-5 text-fg-muted" /><p className="mt-2 text-xs text-fg-muted">No matching term. Try fewer words.</p></div>}
              </div>
              <div className="flex items-center p-5 sm:p-7">
                {displayedGlossaryEntry && <article className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Plain-language definition</p><h2 className="mt-2 text-xl font-bold text-fg">{displayedGlossaryEntry.full}</h2><p className="mt-3 text-sm leading-7 text-fg-secondary">{displayedGlossaryEntry.description}</p>{displayedGlossaryEntry.format || displayedGlossaryEntry.issuedBy ? <div className="mt-5 flex flex-wrap gap-2 text-xs text-fg-muted">{displayedGlossaryEntry.format && <span className="rounded-lg bg-surface-secondary px-3 py-2 font-mono">Example: {displayedGlossaryEntry.format}</span>}{displayedGlossaryEntry.issuedBy && <span className="rounded-lg bg-surface-secondary px-3 py-2">Issued by: {displayedGlossaryEntry.issuedBy}</span>}</div> : null}</article>}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
