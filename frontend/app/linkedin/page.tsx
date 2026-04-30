'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import {
  buildLinkedInAuthUrl,
  getLinkedInConfigError,
  type LinkedInAuthOptions,
} from '@/lib/auth';

function LinkedInPageContent() {
  const searchParams = useSearchParams();

  const authOptions: LinkedInAuthOptions = {
    intent: searchParams.get('intent'),
    next: searchParams.get('next'),
    tier: searchParams.get('tier'),
  };

  const authUrl = buildLinkedInAuthUrl(authOptions);
  const configError = getLinkedInConfigError();
  const isSubscribeFlow = authOptions.intent === 'subscribe';
  const returnPath = authOptions.next || (isSubscribeFlow ? '/billing' : '/dashboard');

  useEffect(() => {
    if (!authUrl) return;

    const timer = window.setTimeout(() => {
      window.location.href = authUrl;
    }, 350);

    return () => window.clearTimeout(timer);
  }, [authUrl]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(160deg, #F8FAFC 0%, #EBF3FB 45%, #F0F9FF 100%)',
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/85"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow:
            '0 4px 6px rgba(0,0,0,0.04), 0 20px 56px rgba(10,102,194,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
        }}
      >
        <div className="border-b border-slate-100 px-6 py-7 text-center">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[14px]"
              style={{
                background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
                boxShadow: '0 4px 16px rgba(10,102,194,0.28)',
              }}
            >
              <span className="text-xl font-black text-white">in</span>
            </div>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-linkedin">
            LinkedIn
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {isSubscribeFlow ? 'Continue to unlock your plan' : 'Continue with LinkedIn'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            VoicePost uses LinkedIn sign-in to create your account, connect your
            profile, and send you back to <span className="font-semibold text-slate-700">{returnPath}</span>.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          {configError ? (
            <div className="rounded-[12px] border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-800">LinkedIn is not configured yet</p>
                  <p className="mt-1 text-sm leading-6 text-red-700">{configError}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-linkedin/10 bg-linkedin-light/60 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-linkedin" />
                <div className="space-y-1 text-sm leading-6 text-slate-600">
                  <p>Secure LinkedIn OAuth handles sign-in.</p>
                  <p>Your approved posts still stay under your review before sharing.</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="rounded-[12px] border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                What happens next
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <p>1. We open LinkedIn for sign-in.</p>
                <p>2. LinkedIn sends you back to VoicePost.</p>
                <p>3. The app resumes at the right page automatically.</p>
              </div>
            </div>

            {authUrl ? (
              <a
                href={authUrl}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-linkedin px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-linkedin-hover active:scale-[0.98]"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)',
                }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to LinkedIn
              </a>
            ) : (
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-linkedin px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-linkedin-hover active:scale-[0.98]"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)',
                }}
              >
                Return to login
              </Link>
            )}

            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <Link href="/" className="transition-colors hover:text-slate-600">
                Home
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-slate-600">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-slate-600">
                Terms
              </Link>
            </div>

            {authUrl && (
              <a
                href={authUrl}
                className="inline-flex items-center gap-1 text-xs font-medium text-linkedin transition-colors hover:text-linkedin-hover"
              >
                Open LinkedIn manually
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LinkedInPage() {
  return (
    <Suspense>
      <LinkedInPageContent />
    </Suspense>
  );
}
