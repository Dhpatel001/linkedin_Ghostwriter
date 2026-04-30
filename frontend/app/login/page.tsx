'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';
import { buildLinkedInEntryPath } from '@/lib/auth';

/* ─── Error messages ────────────────────────────────────────── */
const ERROR_MESSAGES: Record<string, string> = {
    linkedin_denied: 'You declined LinkedIn access. Please allow it to continue.',
    invalid_state: 'Something went wrong with the login. Please try again.',
    auth_failed: 'Login failed. Please try again in a moment.',
    trial_ended: 'Your free trial has ended. Log in to choose a plan.',
    session_expired: 'Your session expired. Please log in again.',
};

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const reason = searchParams.get('reason');
    const next = searchParams.get('next');
    const [isLoading, setIsLoading] = useState(false);

    const authUrl = buildLinkedInEntryPath({ next });

    // Auto-trigger OAuth if no error — returning users just land here briefly
    useEffect(() => {
        if (!error && !reason) {
            const timer = setTimeout(() => {
                setIsLoading(true);
                window.location.href = authUrl;
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [authUrl, error, reason]);

    const handleLogin = () => {
        setIsLoading(true);
        window.location.href = authUrl;
    };

    const errorMessage =
        (error && ERROR_MESSAGES[error]) ||
        (reason === 'trial_ended' && ERROR_MESSAGES.trial_ended) ||
        null;

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4"
            style={{
                background: 'linear-gradient(160deg, #F8FAFC 0%, #EBF3FB 50%, #F0F9FF 100%)',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full max-w-sm"
            >
                {/* Card */}
                <div
                    className="bg-white/85 rounded-[16px] border border-slate-200/80 p-8 text-center"
                    style={{
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow:
                            '0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(10,102,194,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                    }}
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
                                boxShadow: '0 4px 16px rgba(10,102,194,0.30)',
                            }}
                        >
                            <span className="text-white text-xl font-black">V</span>
                        </div>
                    </div>

                    <h1 className="text-lg font-bold text-slate-900 mb-1">
                        Welcome back
                    </h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Sign in with LinkedIn to continue
                    </p>

                    {/* Error banner */}
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2.5 p-3 rounded-[8px] bg-red-50 border border-red-100 mb-5 text-left"
                        >
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 font-medium">{errorMessage}</p>
                        </motion.div>
                    )}

                    {/* LinkedIn OAuth button */}
                    <button
                        onClick={handleLogin}
                        disabled={isLoading && !errorMessage}
                        className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-[8px] text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-70"
                        style={{
                            background: '#0A66C2',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)',
                        }}
                    >
                        {isLoading && !errorMessage ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Redirecting to LinkedIn…
                            </>
                        ) : (
                            <>
                                {/* LinkedIn icon */}
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                Continue with LinkedIn
                            </>
                        )}
                    </button>

                    <p className="text-xs text-slate-400 mt-4">
                        Don&apos;t have an account?{' '}
                        <a href="/" className="text-linkedin font-medium hover:underline">
                            Start free trial
                        </a>
                    </p>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    By continuing you agree to our{' '}
                    <a href="/terms" className="underline hover:text-slate-600">Terms</a>
                    {' '}and{' '}
                    <a href="/privacy" className="underline hover:text-slate-600">Privacy Policy</a>
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
