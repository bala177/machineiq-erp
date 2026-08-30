'use client';

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import {
  AlertTriangle, ArrowRight, BookOpen, Building2, CheckCircle2, ChevronDown,
  FileCog, HelpCircle, KeyRound, LayoutDashboard, PackageCheck, Search,
  ShieldCheck, Truck, Users,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { FAQ, SUPPORT_EMAIL } from '@/lib/app-meta';

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
  { id: 'start', label: 'Release 1 setup', icon: LayoutDashboard },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'partners', label: 'Customers & suppliers', icon: Truck },
  { id: 'items', label: 'Items', icon: PackageCheck },
  { id: 'controls', label: 'Access & numbering', icon: ShieldCheck },
  { id: 'scope', label: 'Release boundary', icon: AlertTriangle },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

const SETUP_STEPS = [
  ['1', 'Organization', 'Create the legal company, then its branches, then physical locations.', '/organization'],
  ['2', 'Access controls', 'Assign users and verify each role in Settings > Permissions.', '/admin/settings'],
  ['3', 'Document numbering', 'Review document prefixes and sequence rules in Settings > Document Types.', '/admin/settings'],
  ['4', 'Business partners', 'Create complete customer and supplier records with generated codes.', '/customers'],
  ['5', 'Item references', 'Create item categories and units of measure before creating items.', '/items'],
  ['6', 'Validate', 'Sign in with each working role and confirm the intended read and edit access.', '#faq'],
] as const;

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl pb-10">
      <PageHeader
        title="Release 1 Help & FAQ"
        description="Follow the PostgreSQL and master-data setup in dependency order."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Building2, title: 'Set up organization', text: 'Company, branches, and locations.', href: '/organization' },
          { icon: PackageCheck, title: 'Build item master', text: 'Categories, UOMs, costs, prices, and items.', href: '/items' },
          { icon: Search, title: 'Check Release 1 FAQ', text: 'Scope, permissions, numbering, and validation.', href: '#faq' },
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
          <HelpSection id="start" icon={LayoutDashboard} title="Complete Release 1 setup" summary="Create shared records in dependency order so later transactions use clean references.">
            <div className="grid gap-3 sm:grid-cols-2">
              {SETUP_STEPS.map(([number, title, text, href]) => (
                <Link key={number} href={href} className="group rounded-xl border border-border p-4 transition hover:border-brand-300 hover:bg-surface-secondary">
                  <div className="flex items-start justify-between gap-3">
                    <div><span className="text-xs font-bold text-brand-600">STEP {number}</span><p className="mt-1 text-sm font-semibold text-fg">{title}</p></div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">{text}</p>
                </Link>
              ))}
            </div>
          </HelpSection>

          <HelpSection id="organization" icon={Building2} title="Define the organization hierarchy" summary="Complete the parent record before adding each dependent level.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['1. Company', 'Enter the legal company identity and business details.'],
                ['2. Branch', 'Add each operating branch under the company.'],
                ['3. Location', 'Add physical locations and assign each one to its branch.'],
              ].map(([title, text]) => <div key={title} className="rounded-xl border border-border p-4"><p className="text-sm font-semibold text-fg">{title}</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">{text}</p></div>)}
            </div>
            <Link href="/organization" className="btn-secondary inline-flex"><Building2 className="h-4 w-4" /> Open Organization</Link>
          </HelpSection>

          <HelpSection id="partners" icon={Truck} title="Create customers and suppliers" summary="Use one complete master record for each business partner.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold text-fg">Customers</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">Record the generated customer code, addresses, contacts, tax details, and commercial identity used by sales.</p><Link href="/customers" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">Open Customers <ArrowRight className="h-3.5 w-3.5" /></Link></div>
              <div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold text-fg">Suppliers</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">Record the generated supplier code, contacts, payment terms, currency, tax details, bank details, and lead-time defaults.</p><Link href="/suppliers" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">Open Suppliers <ArrowRight className="h-3.5 w-3.5" /></Link></div>
            </div>
          </HelpSection>

          <HelpSection id="items" icon={PackageCheck} title="Build the item master" summary="Create classifications first, then create the item that references them.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Item category', 'Group items consistently for filtering and future reporting.'],
                ['Unit of measure', 'Define the valid unit used by the item, such as each, metre, or kilogram.'],
                ['Item', 'Enter code, description, category, UOM, standard cost, selling price, and planning defaults.'],
              ].map(([title, text], index) => <div key={title} className="rounded-xl border border-border p-4"><span className="text-xs font-bold text-brand-600">{index + 1}</span><p className="mt-1 text-sm font-semibold text-fg">{title}</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">{text}</p></div>)}
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800 dark:bg-blue-950/20 dark:text-blue-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Release 1 links engineering components to item records. Stock balances and warehouse movements arrive in a later release.</p>
          </HelpSection>

          <HelpSection id="controls" icon={KeyRound} title="Control access and numbering" summary="Administrators configure both controls before wider UAT.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-xl border border-border p-4"><Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /><div><p className="text-sm font-semibold text-fg">Users and permissions</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">Assign the correct role in Users. In Settings &gt; Permissions, save the explicit capabilities for each role, then test with that role.</p></div></div>
              <div className="flex gap-3 rounded-xl border border-border p-4"><FileCog className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /><div><p className="text-sm font-semibold text-fg">Document types</p><p className="mt-1 text-xs leading-relaxed text-fg-muted">In Settings &gt; Document Types, review prefixes and sequence-reset rules used to generate controlled document references.</p></div></div>
            </div>
            <Link href="/admin/settings" className="btn-secondary inline-flex"><ShieldCheck className="h-4 w-4" /> Open Admin Settings</Link>
          </HelpSection>

          <HelpSection id="scope" icon={AlertTriangle} title="Know the Release 1 boundary" summary="Release 1 establishes trusted master data; it is not the complete ERP transaction suite.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/20"><p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">Included now</p><p className="mt-2 text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">PostgreSQL system of record, organization, customers, suppliers, item master, permissions, document types, and engineering component-to-item linkage.</p></div>
              <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20"><p className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300">Later releases</p><p className="mt-2 text-sm leading-relaxed text-amber-900 dark:text-amber-100">Sales orders, payments, delivery notes, inventory, purchase execution, production, quality, finance, HR, and payroll.</p></div>
            </div>
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
        </div>
      </div>
    </div>
  );
}
