'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ExecutiveView } from './_views/executive-view';
import { PmView } from './_views/pm-view';
import { EngineerView } from './_views/engineer-view';
import { Release1View, type Release1DashboardData } from './_views/release1-view';
import { SalesPipeline, AttentionQueue, RecentRecords, type SalesOverview, type SalesRecordRow } from '@/components/dashboard/sales-pipeline';
import type { ExecutiveDashboard, MyTask, OpportunityItem, ProjectSummary } from '@/components/dashboard/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const [execData,      setExecData]      = useState<ExecutiveDashboard | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [tasks,         setTasks]         = useState<MyTask[]>([]);
  const [projects,      setProjects]      = useState<ProjectSummary[]>([]);
  const [releaseData,   setReleaseData]   = useState<Release1DashboardData | null>(null);
  const [overview,      setOverview]      = useState<SalesOverview | null>(null);
  const [salesRecords,  setSalesRecords]  = useState<SalesRecordRow[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetches: Promise<void>[] = [];

    // The commercial summary renders on arrival rather than holding the page
    // back: both sections are conditional, and blocking on them delayed the
    // route becoming interactive for every role.
    //
    // Scope and permissions are enforced by /sales/overview itself, so every
    // role asks for it and simply renders nothing if sales is not theirs.
    void api.get<SalesOverview>('/sales/overview').then(setOverview).catch(() => {});
    void api.get<{ data: SalesRecordRow[] }>('/sales/records?limit=8').then(res => setSalesRecords(res.data ?? [])).catch(() => {});

    if (['manager', 'leadership'].includes(role)) {
      fetches.push(api.get<{ data: OpportunityItem[]; total: number }>('/opportunities?limit=5').then(res => setOpportunities(res.data ?? [])).catch(() => {}));
    }

    if (role === 'manager') {
      fetches.push(
        api.get<ExecutiveDashboard>('/dashboard/executive?scope=mine').then(setExecData).catch(() => {}),
      );
    } else if (role === 'leadership') {
      fetches.push(
        api.get<ExecutiveDashboard>('/dashboard/executive').then(setExecData).catch(() => {}),
      );
    }

    if (role === 'admin') {
      fetches.push(
        Promise.all([
          api.get<any>('/organization/company').catch(() => null),
          api.get<any[]>('/organization/branches').catch(() => []),
          api.get<any[]>('/organization/locations').catch(() => []),
          api.get<any[]>('/departments').catch(() => []),
          api.get<any[]>('/users').catch(() => []),
          api.get<any[]>('/customers').catch(() => []),
          api.get<any[]>('/suppliers').catch(() => []),
          api.get<any[]>('/items').catch(() => []),
          api.get<any[]>('/items/categories').catch(() => []),
          api.get<any[]>('/items/uoms').catch(() => []),
          api.get<any[]>('/document-types').catch(() => []),
          api.get<{ assignments?: unknown[] }>('/permissions/matrix').catch(() => ({ assignments: [] })),
        ]).then(([company, branches, locations, departments, users, customers, suppliers, items, categories, uoms, documentTypes, permissionMatrix]) => {
          const activeUsers = users.filter((item) => item.isActive !== false);
          setReleaseData({
            companyConfigured: Boolean(company),
            branches: branches.length,
            locations: locations.length,
            departments: departments.length,
            users: activeUsers.length,
            inactiveUsers: users.length - activeUsers.length,
            usersWithoutDepartment: activeUsers.filter((item) => item.role !== 'admin' && !item.departmentId).length,
            customers: customers.length,
            suppliers: suppliers.length,
            items: items.length,
            categories: categories.length,
            uoms: uoms.length,
            documentTypes: documentTypes.length,
            accessAssignments: permissionMatrix.assignments?.length ?? 0,
          });
        }),
      );
    }

    if (role === 'designer') {
      fetches.push(
        api.get<any[]>(`/tasks?ownerId=${user.id}`)
          .then((rows) => setTasks(rows.map((task) => ({ ...task, name: task.name ?? task.title }))))
          .catch(() => {}),
        api.get<ProjectSummary[]>('/projects').then(setProjects).catch(() => {}),
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [user, role]);

  if (loading || !user) return <LoadingSpinner />;

  const description =
    role === 'admin' ? 'Setup readiness, commercial pipeline, and work needing attention' :
    role === 'sales' ? 'Your commercial pipeline and what is waiting on a decision' :
    role === 'manager' ? 'Pipeline, delivery health, and work requiring attention' :
    role === 'designer' ? 'Assigned engineering work and the orders behind it' :
    'Commercial pipeline, delivery health, and project overview';

  return (
    <>
      <PageHeader title="Dashboard" description={description} />

      {overview && (
        <div className="mb-6 space-y-4">
          <SalesPipeline stages={overview.stages} scope={overview.scope} />
          <AttentionQueue attention={overview.attention} />
          <RecentRecords records={salesRecords} />
        </div>
      )}

      {role === 'admin' && releaseData ? (
        <Release1View data={releaseData} />
      ) : role === 'sales' ? null : role === 'manager' && execData ? (
        <PmView data={execData} />
      ) : role === 'designer' ? (
        <EngineerView tasks={tasks} deptDashboard={null} projects={projects} />
      ) : (
        execData && <ExecutiveView data={execData} opportunities={opportunities} />
      )}
    </>
  );
}
