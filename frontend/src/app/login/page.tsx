'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AuthBrandPanel, LogoIcon } from '@/components/auth/auth-brand-panel';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api.get<{ needsSetup: boolean }>('/auth/setup/status')
      .then((res) => {
        if (cancelled) return;
        if (res.needsSetup) {
          router.replace('/setup');
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <AuthBrandPanel />

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 min-w-0 items-center justify-center bg-[#f4f6fb] p-6">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoIcon size={22} color="#1a4fff" />
            <span className="text-[17px] font-semibold text-fg">
              Machine<span className="font-bold text-brand-600">IQ</span>
            </span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-[#e2e6f0] bg-white px-8 py-10 shadow-elevated">
            <div className="mb-7">
              <h1 className="text-[1.6rem] font-bold tracking-tight text-slate-900">Welcome back</h1>
              <p className="mt-1.5 text-[16px] text-slate-500">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 animate-slide-up">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Email address
                </label>
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field text-[16px]" placeholder="you@company.com" />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Password
                </label>
                <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field text-[16px]" placeholder="Enter your password" />
              </div>

              <button type="submit" disabled={loading} className="btn-primary mt-1 w-full py-3 text-[16px]">
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[16px] text-slate-400">Protected by enterprise-grade security</p>
        </div>
      </div>
    </div>
  );
}
