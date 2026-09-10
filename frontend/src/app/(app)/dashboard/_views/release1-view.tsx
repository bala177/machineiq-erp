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
  UsersRound,
  Warehouse,
  BadgePercent,
  Coins,
  ListChecks,
  UserRound,
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
  warehouses: number;
  employees: number;
  currencies: number;
  taxRates: number;
  statuses: number;
};

const setupItems = (data: Release1DashboardData) => [
  { label: 'Company profile', description: 'Add the legal identity and regional defaults.', complete: data.companyConfigured, href: '/organization?section=company', action: 'Set up company profile', icon: Building2 },
  { label: 'Operating branch', description: 'Create the first operating branch.', complete: data.branches > 0, href: '/organization?section=branches', action: 'Add an operating branch', icon: GitBranch },
  { label: 'Physical location', description: 'Add the first office, plant, or warehouse.', complete: data.locations > 0, href: '/organization?section=locations', action: 'Add a physical location', icon: MapPin },
  { label: 'Department', description: 'Define the teams responsible for company work.', complete: data.departments > 0, href: '/organization?section=departments', action: 'Add a department', icon: UsersRound },
  { label: 'Item foundation', description: 'Create at least one category and unit of measure.', complete: data.categories > 0 && data.uoms > 0, href: '/items', action: 'Configure item master', icon: Boxes },
  { label: 'ERP foundation masters', description: 'Confirm warehouse, employee, currency, tax, and status reference data.', complete: data.warehouses > 0 && data.employees > 0 && data.currencies > 0 && data.taxRates > 0 && data.statuses > 0, href: '/admin/settings?tab=foundation', action: 'Configure foundation masters', icon: Warehouse },
  { label: 'Role access', description: 'Confirm what each role is allowed to do.', complete: data.accessAssignments > 0 && data.users > 0, href: '/admin/settings?tab=permissions', action: 'Review role access', icon: ShieldCheck },
  { label: 'Document numbering', description: 'Create numbering rules for business documents.', complete: data.documentTypes > 0, href: '/admin/settings?tab=documentTypes', action: 'Configure document numbering', icon: FileCog },
];

const masterDataRows = (data: Release1DashboardData) => [
  { label: 'Item categories', value: data.categories, icon: Tags, href: '/items' },
  { label: 'Units of measure', value: data.uoms, icon: Ruler, href: '/items' },
  { label: 'Document types', value: data.documentTypes, icon: FileCog, href: '/admin/settings?tab=documentTypes' },
  { label: 'Warehouses', value: data.warehouses, icon: Warehouse, href: '/admin/settings?tab=foundation' },
  { label: 'Employees', value: data.employees, icon: UserRound, href: '/admin/settings?tab=foundation' },
  { label: 'Currencies', value: data.currencies, icon: Coins, href: '/admin/settings?tab=foundation' },
  { label: 'Tax rates', value: data.taxRates, icon: BadgePercent, href: '/admin/settings?tab=foundation' },
  { label: 'Reference statuses', value: data.statuses, icon: ListChecks, href: '/admin/settings?tab=foundation' },
];

/**
 * Master data as one quiet strip rather than four coloured tiles. These are
 * reference counts, not performance indicators — they share one surface and
 * one weight so the pipeline above keeps the eye.
 */
function RecordStrip({ data }: { data: Release1DashboardData }) {
  const cells = [
    { label: 'Customers', value: data.customers, href: '/customers' },
    { label: 'Suppliers', value: data.suppliers, href: '/suppliers' },
    { label: 'Items', value: data.items, href: '/items' },
    { label: 'Active users', value: data.users, href: '/admin/users' },
  ];
  return (
    <section className="card grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
      {cells.map((cell, index) => (
        <Link
          key={cell.label}
          href={cell.href}
          className={`group px-5 py-3.5 transition-colors hover:bg-surface-secondary ${index ? 'sm:border-l sm:border-border' : ''} ${index % 2 ? 'border-l border-border sm:border-l' : ''}`}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">{cell.label}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-semibold tabular-nums text-fg">
            {cell.value}
            <ArrowRight className="h-3.5 w-3.5 text-fg-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </p>
        </Link>
      ))}
    </section>
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

      <RecordStrip data={data} />
    </div>
  );
}

function OperationalView({ data }: { data: Release1DashboardData }) {
  const teamIssues = data.inactiveUsers + data.usersWithoutDepartment;
  const reference = masterDataRows(data);

  return (
    <div className="space-y-4 pb-8">
      <RecordStrip data={data} />

      {/* Only surface team and access when something actually needs doing. */}
      {teamIssues > 0 && (
        <section className="card flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
          <span className="flex items-center gap-2 font-medium text-fg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {teamIssues} user {teamIssues === 1 ? 'record needs' : 'records need'} attention
          </span>
          {data.inactiveUsers > 0 && <span className="text-sm text-fg-muted">{data.inactiveUsers} inactive</span>}
          {data.usersWithoutDepartment > 0 && <span className="text-sm text-fg-muted">{data.usersWithoutDepartment} without a department</span>}
          <Link href="/admin/users" className="ml-auto text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Manage users</Link>
        </section>
      )}

      {/* Configuration is settled once setup is complete: one line, not a panel. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-sm text-fg-muted">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Organization setup complete
        </span>
        {reference.map((row) => (
          <Link key={row.label} href={row.href} className="hover:text-fg hover:underline">
            {row.label} <span className="tabular-nums text-fg-secondary">{row.value}</span>
          </Link>
        ))}
        <Link href="/organization" className="ml-auto font-medium text-brand-600 hover:underline dark:text-brand-400">Review organization</Link>
      </div>
    </div>
  );
}

export function Release1View({ data }: { data: Release1DashboardData }) {
  const setupComplete = setupItems(data).every((item) => item.complete);
  return setupComplete ? <OperationalView data={data} /> : <SetupView data={data} />;
}
