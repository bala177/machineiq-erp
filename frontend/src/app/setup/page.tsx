'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AuthBrandPanel, LogoIcon } from '@/components/auth/auth-brand-panel';

export default function SetupPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [machineSegment, setMachineSegment] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { setup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api.get<{ needsSetup: boolean }>('/auth/setup/status')
      .then((res) => {
        if (cancelled) return;
        if (!res.needsSetup) {
          router.replace('/login');
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
      await setup({
        organizationName,
        machineSegment: machineSegment || undefined,
        email,
        password,
        firstName,
        lastName,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
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

      <div className="flex flex-1 min-w-0 items-center justify-center bg-[#f4f6fb] p-6 py-12">
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
              <h1 className="text-[1.6rem] font-bold tracking-tight text-slate-900">Set up your workspace</h1>
              <p className="mt-1.5 text-[16px] text-slate-500">This runs once — create your company profile and the first admin account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 animate-slide-up">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="organizationName" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  OEM company name
                </label>
                <input id="organizationName" type="text" required value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="input-field text-[16px]" placeholder="Acme Machine Works" />
              </div>

              <div>
                <label htmlFor="machineSegment" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Machine segment <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input id="machineSegment" type="text" value={machineSegment} onChange={(e) => setMachineSegment(e.target.value)} className="input-field text-[16px]" placeholder="e.g. Foundry automation, SPM & fixtures" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-[15px] font-semibold text-slate-700">
                    First name
                  </label>
                  <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field text-[16px]" placeholder="Jane" />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-[15px] font-semibold text-slate-700">
                    Last name
                  </label>
                  <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field text-[16px]" placeholder="Doe" />
                </div>
              </div>

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
                <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field text-[16px]" placeholder="At least 10 characters" />
                <p className="mt-1.5 text-[13px] text-slate-400">Must include an uppercase letter, a lowercase letter, and a number.</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary mt-1 w-full py-3 text-[16px]">
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Create workspace
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[16px] text-slate-400">This page only works once — it disables itself after the first admin account exists.</p>
        </div>
      </div>
    </div>
  );
}
