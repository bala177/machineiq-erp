'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { clsx } from 'clsx';
import {
  UserCircle, SlidersHorizontal, ShieldCheck, Bell,
  Sun, Moon, Check, RefreshCw, Eye, EyeOff,
  Sparkles, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { APP_VERSION, RELEASES } from '@/lib/app-meta';

/* ─── Types ────────────────────────────────────────────────────── */
type NotifPrefs = {
  assignment:    boolean;
  status_change: boolean;
  due_reminder:  boolean;
  overdue:       boolean;
};

const NOTIF_ITEMS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
  { key: 'assignment',    label: 'Task assigned to me', desc: 'When a task or component is assigned to you' },
  { key: 'status_change', label: 'Status changes',      desc: 'When a task you own or follow changes status' },
  { key: 'due_reminder',  label: 'Due date reminders',  desc: 'Before a deadline on your tasks or components' },
  { key: 'overdue',       label: 'Overdue alerts',      desc: 'When items you own pass their due date' },
];

/* ─── Tab config ───────────────────────────────────────────────── */
const TABS = [
  { key: 'profile',      label: 'Profile',      icon: UserCircle },
  { key: 'preferences',  label: 'Preferences',  icon: SlidersHorizontal },
  { key: 'security',     label: 'Security',     icon: ShieldCheck },
  { key: 'notifications',label: 'Notifications',icon: Bell },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/* ─── Toggle ───────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        on ? 'bg-brand-600' : 'bg-border-strong',
      )}
    >
      <span
        className={clsx(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/* ─── Section wrapper ──────────────────────────────────────────── */
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-fg-muted">{desc}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[180px_1fr]">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-fg-secondary">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-fg-muted leading-snug">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ─── Toast ────────────────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={clsx(
      'flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium shadow-lg',
      type === 'success'
        ? 'bg-emerald-600 text-white'
        : 'bg-red-600 text-white',
    )}>
      {type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : null}
      {msg}
    </div>
  );
}

/* ─── Profile Tab ──────────────────────────────────────────────── */
function ProfileTab() {
  const { user } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  }, [user]);

  function flash(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const userId = (user as any)?._id || (user as any)?.id;
      await api.patch(`/users/${userId}`, { firstName: form.firstName, lastName: form.lastName });
      // Sync localStorage so the header updates without a full refresh
      const stored = localStorage.getItem('machineiq_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('machineiq_user', JSON.stringify({ ...parsed, firstName: form.firstName, lastName: form.lastName }));
      }
      flash('Profile updated');
    } catch (e: any) {
      flash(e.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  const roleColors: Record<string, string> = {
    admin:      'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    sales:      'bg-amber-100  text-amber-700  dark:bg-amber-950/40  dark:text-amber-300',
    designer:   'bg-teal-100   text-teal-700   dark:bg-teal-950/40   dark:text-teal-300',
    leadership: 'bg-rose-100   text-rose-700   dark:bg-rose-950/40   dark:text-rose-300',
  };

  return (
    <div className="space-y-4">
      {toast && <div className="flex justify-end"><Toast {...toast} /></div>}

      {/* Avatar strip */}
      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow">
          {form.firstName?.[0]}{form.lastName?.[0]}
        </div>
        <div>
          <p className="font-semibold text-fg">{form.firstName} {form.lastName}</p>
          <p className="text-xs text-fg-muted">{user?.email}</p>
          <span className={clsx(
            'mt-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize',
            roleColors[user?.role ?? ''] ?? 'bg-surface-secondary text-fg-muted',
          )}>
            {user?.role?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <Section title="Personal information">
        <Field label="First name">
          <input
            className="input-field w-full"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="First name"
          />
        </Field>
        <Field label="Last name">
          <input
            className="input-field w-full"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Last name"
          />
        </Field>
        <Field label="Email" hint="Contact your admin to change email">
          <input
            className="input-field w-full opacity-60"
            value={form.email}
            disabled
            readOnly
          />
        </Field>
        <div className="flex justify-end pt-1">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ─── Preferences Tab ──────────────────────────────────────────── */
function PreferencesTab() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light' as const, icon: Sun,  label: 'Light', desc: 'Always light' },
    { value: 'dark'  as const, icon: Moon, label: 'Dark',  desc: 'Always dark'  },
  ];

  return (
    <div className="space-y-4">
      <Section title="Appearance" desc="Choose how MachineIQ looks on this device.">
        <div className="grid gap-3 sm:grid-cols-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={clsx(
                  'group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                  active
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 shadow-sm'
                    : 'border-border bg-surface hover:border-brand-300 hover:bg-surface-secondary/50',
                )}
              >
                <div className={clsx(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  active ? 'bg-brand-600 text-white' : 'bg-surface-secondary text-fg-muted group-hover:text-fg',
                )}>
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className={clsx('text-sm font-semibold', active ? 'text-brand-700 dark:text-brand-300' : 'text-fg')}>{opt.label}</p>
                  <p className="mt-0.5 text-[11px] text-fg-muted">{opt.desc}</p>
                </div>
                {active && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600"><Check className="h-2.5 w-2.5 text-white" /></span>}
              </button>
            );
          })}
        </div>
      </Section>

      {/* What's New teaser */}
      <div className="card flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-fg">MachineIQ v{APP_VERSION}</p>
            <p className="text-xs text-fg-muted">
              Released {new Date(RELEASES[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <Link href="/about/release-notes" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
          What&apos;s new <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─── Security Tab ─────────────────────────────────────────────── */
function SecurityTab() {
  const { user } = useAuth();
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]     = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function flash(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleChangePassword() {
    if (!form.current || !form.next || !form.confirm) {
      flash('All fields are required', 'error'); return;
    }
    if (form.next !== form.confirm) {
      flash('New passwords do not match', 'error'); return;
    }
    if (form.next.length < 10) {
      flash('Password must be at least 10 characters', 'error'); return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: form.current, newPassword: form.next });
      flash('Password changed');
      setForm({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      flash(e.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  }

  function PasswordInput({ id, placeholder, field }: { id: string; placeholder: string; field: keyof typeof form }) {
    const visible = show[field];
    return (
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input-field w-full pr-10"
          placeholder={placeholder}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [field]: !visible })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <div className="flex justify-end"><Toast {...toast} /></div>}

      <Section title="Change password" desc="Use at least 10 characters — include uppercase, lowercase, and a number.">
        <Field label="Current password">
          <PasswordInput id="cur-pw" placeholder="Enter current password" field="current" />
        </Field>
        <Field label="New password">
          <PasswordInput id="new-pw" placeholder="New password (min 10 chars)" field="next" />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput id="conf-pw" placeholder="Repeat new password" field="confirm" />
        </Field>
        <div className="flex justify-end pt-1">
          <button onClick={handleChangePassword} disabled={saving} className="btn-primary">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Update password
          </button>
        </div>
      </Section>

      <Section title="Session info">
        <Field label="Signed in as" hint="Session auto-expires after 8 hours">
          <p className="text-sm text-fg">{user?.email}</p>
        </Field>
        <Field label="Role">
          <p className="text-sm capitalize text-fg">{user?.role?.replace(/_/g, ' ')}</p>
        </Field>
      </Section>
    </div>
  );
}

/* ─── Notifications Tab ────────────────────────────────────────── */
function NotificationsTab() {
  const [prefs, setPrefs]   = useState<NotifPrefs>({
    assignment: true, status_change: true, due_reminder: true, overdue: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.get<any>('/settings/notification_preferences')
      .then((res) => {
        const v = res?.value ?? res;
        if (v && typeof v === 'object' && 'assignment' in v) setPrefs(v as NotifPrefs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function flash(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/settings/notification_preferences', { value: prefs });
      flash('Preferences saved');
    } catch {
      flash('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  const allOn  = Object.values(prefs).every(Boolean);
  const allOff = Object.values(prefs).every((v) => !v);

  return (
    <div className="space-y-4">
      {toast && <div className="flex justify-end"><Toast {...toast} /></div>}

      <Section title="Email & in-app notifications" desc="Choose what you want to be notified about.">
        {/* Bulk toggles */}
        <div className="flex items-center gap-3 pb-1">
          <button type="button" onClick={() => setPrefs(Object.fromEntries(NOTIF_ITEMS.map(({ key }) => [key, true])) as NotifPrefs)}
            className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-40"
            disabled={allOn}>Enable all</button>
          <span className="text-fg-muted">·</span>
          <button type="button" onClick={() => setPrefs(Object.fromEntries(NOTIF_ITEMS.map(({ key }) => [key, false])) as NotifPrefs)}
            className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-40"
            disabled={allOff}>Disable all</button>
        </div>

        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {NOTIF_ITEMS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 bg-surface px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">{label}</p>
                <p className="text-xs text-fg-muted">{desc}</p>
              </div>
              <Toggle on={prefs[key]} onChange={(v) => setPrefs({ ...prefs, [key]: v })} />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save preferences
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const ActiveTabContent = {
    profile:       <ProfileTab />,
    preferences:   <PreferencesTab />,
    security:      <SecurityTab />,
    notifications: <NotificationsTab />,
  }[activeTab];

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, appearance, security, and notifications." />

      <div className="flex flex-col gap-5 md:flex-row md:gap-6 pb-8">
        {/* Sidebar tabs */}
        <aside className="w-full md:w-48 lg:w-52 shrink-0">
          <div className="card overflow-hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left text-sm transition-colors',
                    active
                      ? 'border-brand-500 bg-brand-50/60 font-semibold text-fg dark:bg-brand-950/20'
                      : 'border-transparent text-fg-secondary hover:bg-surface-secondary',
                  )}
                >
                  <Icon className={clsx('h-4 w-4 shrink-0', active ? 'text-brand-600 dark:text-brand-400' : 'text-fg-muted')} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {ActiveTabContent}
        </div>
      </div>
    </>
  );
}
