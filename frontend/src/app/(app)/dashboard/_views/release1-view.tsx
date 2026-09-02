import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  FileCog,
  GitBranch,
  MapPin,
  Ruler,
  ShieldCheck,
  Tags,
  Truck,
  UsersRound,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';

export type Release1DashboardData = {
  companyConfigured: boolean;
  branches: number;
  locations: number;
  departments: number;
  users: number;
  inactiveUsers: number;
  usersWithoutDepartment: number;
  customers: number;
  suppliers: number;
  items: number;
  categories: number;
  uoms: number;
  documentTypes: number;
  accessAssignments: number;
};

const setupItems = (data: Release1DashboardData) => [
  { label: 'Company profile', description: 'Add the legal identity and regional defaults.', complete: data.companyConfigured, href: '/organization?section=company', action: 'Set up company profile', icon: Building2 },
  { label: 'Operating branch', description: 'Create the first operating branch.', complete: data.branches > 0, href: '/organization?section=branches', action: 'Add an operating branch', icon: GitBranch },
  { label: 'Physical location', description: 'Add the first office, plant, or warehouse.', complete: data.locations > 0, href: '/organization?section=locations', action: 'Add a physical location', icon: MapPin },
  { label: 'Department', description: 'Define the teams responsible for company work.', complete: data.departments > 0, href: '/organization?section=departments', action: 'Add a department', icon: UsersRound },
  { label: 'Item foundation', description: 'Create at least one category and unit of measure.', complete: data.categories > 0 && data.uoms > 0, href: '/items', action: 'Configure item master', icon: Boxes },
  { label: 'Role access', description: 'Confirm what each role is allowed to do.', complete: data.accessAssignments > 0 && data.users > 0, href: '/admin/settings?tab=permissions', action: 'Review role access', icon: ShieldCheck },
  { label: 'Document numbering', description: 'Create numbering rules for business documents.', complete: data.documentTypes > 0, href: '/admin/settings?tab=documentTypes', action: 'Configure document numbering', icon: FileCog },
];

const masterDataRows = (data: Release1DashboardData) => [
  { label: 'Item categories', value: data.categories, icon: Tags, href: '/items' },
  { label: 'Units of measure', value: data.uoms, icon: Ruler, href: '/items' },
  { label: 'Document types', value: data.documentTypes, icon: FileCog, href: '/admin/settings?tab=documentTypes' },
];

function SummaryCards({ data }: { data: Release1DashboardData }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard label="Customers" value={data.customers} icon={<Building2 />} accent="violet" href="/customers" />
      <KpiCard label="Suppliers" value={data.suppliers} icon={<Truck />} accent="amber" href="/suppliers" />
      <KpiCard label="Items" value={data.items} icon={<Boxes />} accent="blue" href="/items" />
      <KpiCard label="Active users" value={data.users} icon={<UsersRound />} accent="green" href="/admin/users" />
    </div>
  );
}

function MasterDataStatus({ data }: { data: Release1DashboardData }) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-fg">Master data status</h2>
      <p className="mt-1 text-sm text-fg-muted">Reference data available for daily work.</p>
      <div className="mt-4 divide-y divide-border">
        {masterDataRows(data).map((item) => (
          <Link key={item.label} href={item.href} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <item.icon className="h-4 w-4 text-fg-muted" />
            <span className="flex-1 text-sm text-fg-secondary">{item.label}</span>
            <span className={item.value > 0 ? 'badge-green' : 'badge-amber'}>{item.value > 0 ? `${item.value} available` : 'Needs setup'}</span>
            <ArrowRight className="h-3.5 w-3.5 text-fg-muted" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function SetupView({ data }: { data: Release1DashboardData }) {
  const items = setupItems(data);
  const completed = items.filter((item) => item.complete).length;
  const nextIndex = items.findIndex((item) => !item.complete);
  const next = items[nextIndex];
  const percent = Math.round((completed / items.length) * 100);

  return (
    <div className="space-y-6 pb-8">
      <section className="card overflow-hidden border-brand-200 dark:border-brand-900">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
          <div>
            <span className="badge-blue">Setup in progress</span>
            <h2 className="mt-3 text-xl font-bold text-fg">Next: {next.label}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-fg-secondary">{next.description}</p>
            <Link href={next.href} className="btn-primary mt-4 inline-flex">{next.action} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-xl bg-surface-secondary p-4">
            <div className="flex items-end justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Organization readiness</p><p className="mt-1 text-3xl font-bold text-fg">{percent}%</p></div>
              <p className="pb-1 text-sm text-fg-muted">{completed} of {items.length} complete</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-tertiary"><div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} /></div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="card p-5">
          <h2 className="font-semibold text-fg">Organization setup</h2>
          <p className="mt-1 text-sm text-fg-muted">Complete these steps in order to prepare the workspace.</p>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {items.map((item, index) => {
              const isNext = index === nextIndex;
              return (
                <li key={item.label}>
                  <Link href={item.href} className={`flex min-h-[76px] items-start gap-3 rounded-xl border p-3.5 transition-colors ${isNext ? 'border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/20' : 'border-border hover:border-border-strong hover:bg-surface-secondary'}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.complete ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : isNext ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'bg-surface-secondary text-fg-muted'}`}>
                      {item.complete ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-bold">{index + 1}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-fg">{item.label}</p><span className={item.complete ? 'badge-green' : isNext ? 'badge-blue' : 'badge-gray'}>{item.complete ? 'Complete' : isNext ? 'Next' : 'Not started'}</span></div>
                      <p className="mt-1 text-xs text-fg-muted">{item.description}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-5">
          <MasterDataStatus data={data} />
          <section className="card p-5">
            <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h2 className="font-semibold text-fg">Why setup matters</h2><p className="mt-1 text-sm leading-relaxed text-fg-muted">Organization and reference data are reused in customers, suppliers, items, users, and business documents.</p></div></div>
          </section>
        </div>
      </div>

      <SummaryCards data={data} />
    </div>
  );
}

function OperationalView({ data }: { data: Release1DashboardData }) {
  const teamIssues = data.inactiveUsers + data.usersWithoutDepartment;

  return (
    <div className="space-y-6 pb-8">
      <SummaryCards data={data} />

      <section className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /></div><div><h2 className="font-semibold text-fg">Organization setup complete</h2><p className="mt-0.5 text-sm text-fg-muted">Company structure, role access, item references, and document numbering are ready.</p></div></div>
        <Link href="/organization" className="btn-secondary shrink-0">Review organization</Link>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <MasterDataStatus data={data} />

        <section className="card p-5">
          <h2 className="font-semibold text-fg">Team and access</h2>
          <p className="mt-1 text-sm text-fg-muted">People and access records requiring attention.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-secondary p-4"><p className="text-2xl font-bold text-fg">{data.users}</p><p className="mt-1 text-xs text-fg-muted">Active users</p></div>
            <div className="rounded-xl bg-surface-secondary p-4"><p className={`text-2xl font-bold ${teamIssues ? 'text-amber-600' : 'text-emerald-600'}`}>{teamIssues}</p><p className="mt-1 text-xs text-fg-muted">Records needing attention</p></div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-fg-secondary">Inactive users</span><span className="font-semibold text-fg">{data.inactiveUsers}</span></div>
            <div className="flex items-center justify-between"><span className="text-fg-secondary">Users without departments</span><span className="font-semibold text-fg">{data.usersWithoutDepartment}</span></div>
            <div className="flex items-center justify-between"><span className="text-fg-secondary">Role access</span><span className={data.accessAssignments > 0 ? 'badge-green' : 'badge-amber'}>{data.accessAssignments > 0 ? 'Configured' : 'Review needed'}</span></div>
          </div>
          <Link href="/admin/users" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">Manage users <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="font-semibold text-fg">Quick actions</h2>
        <p className="mt-1 text-sm text-fg-muted">Maintain the records used most often.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Manage customers', href: '/customers', icon: Building2 },
            { label: 'Manage suppliers', href: '/suppliers', icon: Truck },
            { label: 'Manage items', href: '/items', icon: Boxes },
            { label: 'Manage organization', href: '/organization', icon: GitBranch },
          ].map((item) => <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-xl border border-border p-3.5 text-sm font-semibold text-fg transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-900 dark:hover:bg-brand-950/10"><item.icon className="h-4 w-4 text-brand-600" /><span className="flex-1">{item.label}</span><ArrowRight className="h-4 w-4 text-fg-muted" /></Link>)}
        </div>
      </section>
    </div>
  );
}

export function Release1View({ data }: { data: Release1DashboardData }) {
  const setupComplete = setupItems(data).every((item) => item.complete);
  return setupComplete ? <OperationalView data={data} /> : <SetupView data={data} />;
}
