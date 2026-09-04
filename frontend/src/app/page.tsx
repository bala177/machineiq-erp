'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    api.get<{ needsSetup: boolean }>('/auth/setup/status')
      .then(({ needsSetup }) => {
        if (!cancelled) {
          router.replace(needsSetup ? '/setup' : user ? '/dashboard' : '/login');
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace(user ? '/dashboard' : '/login');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand-600" />
    </div>
  );
}
