'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ExecutiveView } from './_views/executive-view';
import { SalesView } from './_views/sales-view';
import { PmView } from './_views/pm-view';
import { EngineerView } from './_views/engineer-view';
import { Release1View, type Release1DashboardData } from './_views/release1-view';
import type { ExecutiveDashboard, MyTask, OpportunityItem, ProjectSummary } from '@/components/dashboard/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const [execData,      setExecData]      = useState<ExecutiveDashboard | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [tasks,         setTasks]         = useState<MyTask[]>([]);
  const [projects,      setProjects]      = useState<ProjectSummary[]>([]);
  const [releaseData,   setReleaseData]   = useState<Release1DashboardData | null>(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetches: Promise<void>[] = [];

    if (['manager', 'sales', 'leadership'].includes(role)) {
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
    role === 'admin' ? 'Organization setup and master data overview' :
    role === 'sales' ? 'Machine inquiry pipeline and review status' :
    role === 'manager' ? 'Projects, delivery health, and work requiring attention' :
    role === 'designer' ? 'Assigned engineering work and project context' :
    'Customers, machine inquiries, and project health overview';

  return (
    <>
      <PageHeader title="Dashboard" description={description} />

      {role === 'admin' && releaseData ? (
        <Release1View data={releaseData} />
      ) : role === 'sales' ? (
        <SalesView opportunities={opportunities} />
      ) : role === 'manager' && execData ? (
        <PmView data={execData} />
      ) : role === 'designer' ? (
        <EngineerView tasks={tasks} deptDashboard={null} projects={projects} />
      ) : (
        execData && <ExecutiveView data={execData} opportunities={opportunities} />
      )}
    </>
  );
}
