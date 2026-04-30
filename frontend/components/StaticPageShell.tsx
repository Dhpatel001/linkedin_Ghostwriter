import type { ReactNode } from 'react';
import Link from 'next/link';

interface StaticPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function StaticPageShell({
  eyebrow,
  title,
  description,
  children,
}: StaticPageShellProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #F8FAFC 0%, #EBF3FB 45%, #F0F9FF 100%)',
      }}
    >
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-[6px]"
              style={{
                background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
                boxShadow: '0 1px 3px rgba(10,102,194,0.30)',
              }}
            >
              <span className="text-xs font-black text-white">V</span>
            </div>
            <span className="text-sm font-bold text-slate-900">VoicePost</span>
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <Link href="/linkedin" className="font-medium text-slate-500 transition-colors hover:text-slate-800">
              LinkedIn
            </Link>
            <Link
              href="/login"
              className="rounded-[6px] border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div
          className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/85"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow:
              '0 4px 6px rgba(0,0,0,0.04), 0 20px 56px rgba(10,102,194,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
          }}
        >
          <div className="border-b border-slate-100 px-6 py-8 sm:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-linkedin">
              {eyebrow}
            </p>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
              {description}
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 text-sm leading-7 text-slate-600 sm:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
