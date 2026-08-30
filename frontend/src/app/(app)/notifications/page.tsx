'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Bell, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api
      .get<any[]>('/notifications')
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all', {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {});
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          notifications.some((n) => !n.read) ? (
            <button onClick={markAllRead} className="btn-secondary text-xs">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="No notifications" description="You're all caught up" />
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => (
            <button key={n._id} onClick={() => !n.read && markRead(n._id)} className={clsx('card flex w-full items-start gap-3.5 p-4 text-left transition-all duration-150 hover:shadow-card-hover', !n.read && 'border-l-4 border-l-brand-500 bg-brand-50/20')}>
              <div className={clsx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', n.read ? 'bg-surface-tertiary' : 'bg-brand-50 dark:bg-brand-950/30')}>
                <Bell className={clsx('h-4 w-4', n.read ? 'text-fg-muted' : 'text-brand-500')} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={clsx('text-sm', n.read ? 'text-fg-tertiary' : 'font-semibold text-fg')}>{n.title}</p>
                <p className="mt-0.5 text-xs text-fg-tertiary">{n.message}</p>
                <p className="mt-1.5 text-[15px] font-medium text-fg-muted">{formatDate(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
