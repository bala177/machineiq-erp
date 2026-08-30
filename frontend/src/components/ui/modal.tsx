'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  noPadding?: boolean;
}

const sizeClass = {
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function Modal({ title, onClose, children, size = 'md', noPadding = false }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className={clsx('w-full rounded-2xl border border-border bg-surface shadow-2xl', sizeClass[size])}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="btn-ghost px-2 py-2" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={clsx('max-h-[80vh] overflow-y-auto', !noPadding && 'p-5')}>{children}</div>
      </div>
    </div>
  );
}
