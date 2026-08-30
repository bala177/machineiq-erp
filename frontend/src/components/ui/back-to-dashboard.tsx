'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

export function BackToDashboard() {
  const params = useSearchParams();
  const router = useRouter();

  if (params.get('ref') !== 'dashboard') return null;

  return (
    <button
      onClick={() => router.push('/dashboard')}
      className="mb-4 flex items-center gap-1.5 text-[16px] font-semibold text-brand-600 hover:text-brand-700 transition-colors group"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      <LayoutDashboard className="h-3.5 w-3.5" />
      <span>Back to Dashboard</span>
    </button>
  );
}
