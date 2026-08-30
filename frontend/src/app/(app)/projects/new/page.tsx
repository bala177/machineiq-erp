'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';

const stages = ['inquiry', 'feasibility', 'concept_approved', 'engineering_in_progress', 'review_release', 'procurement_in_progress', 'build_assembly', 'fat_sat', 'completed', 'on_hold', 'cancelled'];
const healthOptions = ['healthy', 'watch', 'at_risk', 'delayed'];
const priorities = ['low', 'medium', 'high', 'critical'];

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedOpportunityId = searchParams.get('opportunityId') || '';
  const [customers, setCustomers] = useState<any[]>([]);
  const [projectLeads, setProjectLeads] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    opportunityId: selectedOpportunityId,
    customerId: '',
    projectManagerId: '',
    stage: 'inquiry',
    health: 'healthy',
    priority: 'medium',
    targetDeliveryDate: '',
    startDate: '',
  });
  const conversionBlocked = Boolean(form.opportunityId && selectedOpportunity && selectedOpportunity.status !== 'approved');

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/customers'),
      api.get<any[]>('/users'),
      api.get<{ data: any[]; total: number } | any[]>('/opportunities?status=approved&limit=100'),
    ])
      .then(([customerData, userData, opportunityRes]) => {
        const opportunityData = Array.isArray(opportunityRes) ? opportunityRes : (opportunityRes as any).data ?? [];
        setCustomers(customerData);
        setProjectLeads(userData);
        setOpportunities(opportunityData);

        const matchedOpportunity = opportunityData.find((opportunity: any) => opportunity._id === selectedOpportunityId);
        setSelectedOpportunity(matchedOpportunity || null);
        setForm((current) => ({
          ...current,
          opportunityId: selectedOpportunityId,
          customerId: matchedOpportunity?.customerId?._id || current.customerId || customerData[0]?._id || '',
          name: current.name || matchedOpportunity?.title || '',
          targetDeliveryDate: current.targetDeliveryDate || (matchedOpportunity?.deliveryTargetDate ? new Date(matchedOpportunity.deliveryTargetDate).toISOString().slice(0, 10) : ''),
          projectManagerId: current.projectManagerId || userData[0]?._id || '',
          stage: matchedOpportunity?.status === 'approved' ? 'feasibility' : current.stage,
        }));
      })
      .catch((err: any) => setError(err.message || 'Failed to load project form data'))
      .finally(() => setLoading(false));
  }, [selectedOpportunityId]);

  const updateField = (name: string, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleOpportunityChange = (value: string) => {
    const selected = opportunities.find((opportunity) => opportunity._id === value);
    setSelectedOpportunity(selected || null);
    setForm((current) => ({
      ...current,
      opportunityId: value,
      customerId: selected?.customerId?._id || current.customerId,
      name: current.name || selected?.title || '',
      targetDeliveryDate: current.targetDeliveryDate || (selected?.deliveryTargetDate ? new Date(selected.deliveryTargetDate).toISOString().slice(0, 10) : ''),
      stage: selected?.status === 'approved' ? 'feasibility' : current.stage,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (form.opportunityId) {
        if (selectedOpportunity?.status !== 'approved') {
          throw new Error('Only approved machine inquiries can be converted into a project');
        }
        const converted = await api.post<any>(`/opportunities/${form.opportunityId}/convert`, {
          name: form.name,
          description: form.description || undefined,
          customerId: form.customerId || undefined,
          projectManagerId: form.projectManagerId,
          stage: form.stage,
          health: form.health,
          priority: form.priority,
          targetDeliveryDate: form.targetDeliveryDate || undefined,
          startDate: form.startDate || undefined,
        });
        router.push(`/projects/${converted.project._id}`);
        return;
      }

      const created = await api.post<any>('/projects', {
        ...form,
        opportunityId: undefined,
        targetDeliveryDate: form.targetDeliveryDate || undefined,
        startDate: form.startDate || undefined,
      });
      router.push(`/projects/${created._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-fg-tertiary">Loading project form…</p>;
  }

  return (
    <>
      <PageHeader
        title="New Project"
        description={form.opportunityId ? 'Convert an approved machine inquiry into a tracked project and preserve the audit trail.' : 'Create a tracked machine project and kickoff shell'}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/customers" className="btn-secondary">
              <Building2 className="h-4 w-4" />
              Customers
            </Link>
            <Link href="/projects" className="btn-back">
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Link>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3.5 text-sm text-red-700 dark:text-red-400">{error}</div>}

        {form.opportunityId && selectedOpportunity && selectedOpportunity.status !== 'approved' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            This machine inquiry is currently <strong>{selectedOpportunity.status.replace(/_/g, ' ')}</strong>. Conversion is only allowed after the machine inquiry is approved.
          </div>
        )}

        {form.opportunityId && selectedOpportunity && (
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-fg">Machine Inquiry Sync</h2>
            <p className="mt-1 text-sm text-fg-muted">
              The linked customer and delivery target are pulled from the source machine inquiry to keep the handoff clean. You can override them here, but the project will stay linked back to the original machine inquiry.
            </p>
          </div>
        )}

        <div className="card grid gap-5 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Project Name
            </label>
            <input id="name" className="input-field" required value={form.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Description
            </label>
            <textarea id="description" className="input-field min-h-24" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          </div>

          <div>
            <label htmlFor="opportunityId" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Source Machine Inquiry <span className="font-normal text-fg-muted">(approved only)</span>
            </label>
            <select id="opportunityId" className="input-field" value={form.opportunityId} onChange={(e) => handleOpportunityChange(e.target.value)}>
              <option value="">No linked machine inquiry</option>
              {opportunities.map((opportunity) => (
                <option key={opportunity._id} value={opportunity._id}>
                  {opportunity.requestNo ? `${opportunity.requestNo} — ` : ''}{opportunity.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="customerId" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Customer
            </label>
            <select id="customerId" className="input-field" required value={form.customerId} onChange={(e) => updateField('customerId', e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="projectManagerId" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Project Lead
            </label>
            <select id="projectManagerId" className="input-field" required value={form.projectManagerId} onChange={(e) => updateField('projectManagerId', e.target.value)}>
              <option value="">Select project lead</option>
              {projectLeads.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stage" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Stage
            </label>
            <select id="stage" className="input-field" value={form.stage} onChange={(e) => updateField('stage', e.target.value)}>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="health" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Health
            </label>
            <select id="health" className="input-field" value={form.health} onChange={(e) => updateField('health', e.target.value)}>
              {healthOptions.map((health) => (
                <option key={health} value={health}>
                  {health.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Priority
            </label>
            <select id="priority" className="input-field" value={form.priority} onChange={(e) => updateField('priority', e.target.value)}>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.replace(/\b\w/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="targetDeliveryDate" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Target Delivery Date
            </label>
            <input id="targetDeliveryDate" className="input-field" type="date" value={form.targetDeliveryDate} onChange={(e) => updateField('targetDeliveryDate', e.target.value)} />
          </div>

          <div>
            <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-fg-secondary">
              Start Date
            </label>
            <input id="startDate" className="input-field" type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/projects" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" disabled={saving || conversionBlocked} className="btn-primary">
            {saving ? (form.opportunityId ? 'Converting…' : 'Creating…') : form.opportunityId ? 'Convert to Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </>
  );
}
