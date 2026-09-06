'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Bug, Camera, CheckCircle2, Lightbulb, MessageCircle, MousePointer2, Smile, X } from 'lucide-react';
import { api, getRecentApiError } from '@/lib/api';
import { APP_VERSION, GIT_COMMIT } from '@/lib/app-meta';
import { FeedbackType, FeedbackUrgency, feedbackTypeLabels } from '@/lib/feedback';
import { clsx } from 'clsx';

const types: { value: FeedbackType; icon: typeof Bug }[] = [
  { value: 'broken', icon: Bug }, { value: 'hard_to_use', icon: MousePointer2 },
  { value: 'suggestion', icon: Lightbulb }, { value: 'general', icon: MessageCircle }, { value: 'positive', icon: Smile },
];

export function FeedbackWidget({ enabled, onSubmitted }: { enabled: boolean; onSubmitted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('broken');
  const [urgency, setUrgency] = useState<FeedbackUrgency>('important');
  const [message, setMessage] = useState('');
  const [contactAllowed, setContactAllowed] = useState(true);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open) setTimeout(() => textareaRef.current?.focus(), 100); }, [open]);
  useEffect(() => {
    if (!open) return;
    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith('image/'))?.getAsFile();
      if (image) void loadImage(image);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open]);

  if (!enabled) return null;

  const loadImage = async (file: File) => {
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setError('Use a PNG, JPEG, or WebP screenshot.');
    if (file.size > 2 * 1024 * 1024) return setError('Screenshot must be 2 MB or smaller.');
    const reader = new FileReader();
    reader.onload = () => setScreenshot(String(reader.result));
    reader.readAsDataURL(file);
  };

  const pickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadImage(file);
  };

  const reset = () => {
    setType('broken'); setUrgency('important'); setMessage(''); setContactAllowed(true); setScreenshot(null); setError(''); setSent(false);
  };

  const close = () => { setOpen(false); setTimeout(reset, 200); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (message.trim().length < 5) return setError('Please add a little more detail.');
    setSaving(true); setError('');
    try {
      const width = window.innerWidth;
      await api.post('/feedback', {
        type, urgency, message: message.trim(), contactAllowed, screenshotDataUrl: screenshot || undefined,
        pagePath: window.location.pathname, pageTitle: document.title.slice(0, 200), appVersion: APP_VERSION, gitCommit: GIT_COMMIT,
        browser: navigator.userAgent.slice(0, 500), deviceType: width < 768 ? 'mobile' : width < 1100 ? 'tablet' : 'desktop',
        viewportWidth: width, viewportHeight: window.innerHeight, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        recentApiError: getRecentApiError() || undefined,
      });
      setSent(true); onSubmitted?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send feedback.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-[76px] right-4 z-30 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700 md:bottom-6 md:right-6" aria-label="Send feedback">
        <MessageCircle className="h-5 w-5" /><span className="hidden sm:inline">Feedback</span>
      </button>
      {open && <div className="fixed inset-0 z-[200] bg-black/35 backdrop-blur-[1px]" onMouseDown={(e) => e.target === e.currentTarget && close()}>
        <section role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl">
          <header className="flex items-start justify-between border-b border-border px-5 py-4">
            <div><h2 id="feedback-title" className="text-lg font-bold text-fg">Help us improve MachineIQ</h2><p className="mt-1 text-xs text-fg-muted">Usually takes less than a minute.</p></div>
            <button onClick={close} className="rounded-lg p-2 text-fg-muted hover:bg-surface-secondary" aria-label="Close feedback"><X className="h-5 w-5" /></button>
          </header>
          {sent ? <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" /><h3 className="mt-4 text-xl font-bold text-fg">Thank you</h3><p className="mt-2 text-sm text-fg-muted">Your feedback is saved. You can follow its status in My Feedback.</p>
            <button onClick={close} className="btn-primary mt-6">Done</button>
          </div> : <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <fieldset><legend className="mb-2 text-sm font-semibold text-fg">What would you like to share?</legend><div className="grid grid-cols-2 gap-2">
                {types.map(({ value, icon: Icon }) => <button type="button" key={value} onClick={() => setType(value)} className={clsx('flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition', type === value ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' : 'border-border text-fg-secondary hover:bg-surface-secondary')}><Icon className="h-4 w-4 shrink-0" />{feedbackTypeLabels[value]}</button>)}
              </div></fieldset>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-fg">Tell us what happened <span className="text-red-500">*</span></span><textarea ref={textareaRef} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} placeholder="What did you try? What did you expect, and what happened instead?" className="input resize-y" /><span className="mt-1 block text-right text-[11px] text-fg-muted">{message.length}/5000</span></label>
              <fieldset><legend className="mb-2 text-sm font-semibold text-fg">Impact</legend><div className="grid grid-cols-3 gap-2">{(['blocking','important','minor'] as FeedbackUrgency[]).map((value) => <button type="button" key={value} onClick={() => setUrgency(value)} className={clsx('rounded-lg border px-2 py-2 text-xs font-medium capitalize', urgency === value ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' : 'border-border text-fg-secondary')}>{value}</button>)}</div></fieldset>
              <div><p className="mb-2 text-sm font-semibold text-fg">Screenshot <span className="font-normal text-fg-muted">(optional)</span></p>{screenshot ? <div className="relative overflow-hidden rounded-lg border border-border"><img src={screenshot} alt="Screenshot preview" className="max-h-52 w-full object-contain bg-surface-secondary" /><button type="button" onClick={() => setScreenshot(null)} className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"><X className="h-4 w-4" /></button></div> : <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-4 text-xs text-fg-muted hover:bg-surface-secondary"><Camera className="h-4 w-4" />Upload or paste a screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} className="sr-only" /></label>}</div>
              <label className="flex items-start gap-3 rounded-lg bg-surface-secondary p-3 text-xs text-fg-secondary"><input type="checkbox" checked={contactAllowed} onChange={(e) => setContactAllowed(e.target.checked)} className="mt-0.5" /><span>You may contact me about this feedback.</span></label>
              <p className="text-[11px] leading-relaxed text-fg-muted">We attach the page, app version, browser, screen size, and last API error. We never attach passwords, tokens, form values, request bodies, or documents.</p>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-4"><button type="button" onClick={close} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Sending…' : 'Send feedback'}</button></footer>
          </form>}
        </section>
      </div>}
    </>
  );
}
