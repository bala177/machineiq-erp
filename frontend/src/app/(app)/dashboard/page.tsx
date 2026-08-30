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
import type { ExecutiveDashboard, MyTask, OpportunityItem, ProjectSummary } from '@/components/dashboard/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const [execData,      setExecData]      = useState<ExecutiveDashboard | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [tasks,         setTasks]         = useState<MyTask[]>([]);
  const [projects,      setProjects]      = useState<ProjectSummary[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetches: Promise<void>[] = [];

    if (['admin', 'manager', 'sales', 'leadership'].includes(role)) {
      fetches.push(api.get<{ data: OpportunityItem[]; total: number }>('/opportunities?limit=5').then(res => setOpportunities(res.data ?? [])).catch(() => {}));
    }

    if (role === 'manager') {
      fetches.push(
        api.get<ExecutiveDashboard>('/dashboard/executive?scope=mine').then(setExecData).catch(() => {}),
      );
    } else if (role === 'admin' || role === 'leadership') {
      fetches.push(
        api.get<ExecutiveDashboard>('/dashboard/executive').then(setExecData).catch(() => {}),
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
    role === 'sales' ? 'Machine inquiry pipeline and review status' :
    role === 'manager' ? 'Projects, delivery health, and work requiring attention' :
    role === 'designer' ? 'Assigned engineering work and project context' :
    'Customers, machine inquiries, and project health overview';

  return (
    <>
      <PageHeader title="Dashboard" description={description} />

      {role === 'sales' ? (
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
