'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry or similar in production
    console.error('[app error]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}
    >
      <div className="text-4xl mb-4 select-none">⚡</div>

      <h2 className="text-lg font-bold text-slate-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
        An unexpected error occurred. Your data is safe — this is likely a
        temporary issue.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="py-2.5 px-5 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] transition-all duration-150 active:scale-[0.97]"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.10), 0 4px 12px rgba(10,102,194,0.20)' }}
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="py-2.5 px-5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-[8px] transition-all duration-150"
        >
          Go to dashboard
        </a>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 max-w-lg text-left">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
            Error details (dev only)
          </summary>
          <pre className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-[8px] p-3 overflow-auto max-h-48">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
