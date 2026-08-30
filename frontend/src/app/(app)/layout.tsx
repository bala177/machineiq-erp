'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import AppShell from '@/components/layout/app-shell';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand-600" />
      </div>
    );
  }

  return (
    <AppShell>
      <Suspense fallback={null}>
        <BackToDashboard />
      </Suspense>
      {children}
    </AppShell>
  );
}
