'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token  = searchParams.get('token');
        const intent = searchParams.get('intent');
        const tier   = searchParams.get('tier');

        if (!token) {
            // No token — something went wrong
            router.replace('/login?error=auth_failed');
            return;
        }

        // Store the JWT in a cookie (7-day expiry, matches backend)
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `voicepost_token=${token}; path=/; expires=${expires}; SameSite=Lax`;

        // Redirect based on intent
        if (intent === 'subscribe') {
            const billingUrl = new URL('/billing', window.location.origin);
            if (tier) billingUrl.searchParams.set('tier', tier);
            router.replace(billingUrl.pathname + billingUrl.search);
        } else {
            router.replace('/dashboard');
        }
    }, [router, searchParams]);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #EBF3FB 100%)' }}
        >
            <Loader2 className="w-6 h-6 text-linkedin animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Signing you in…</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense>
            <AuthCallbackContent />
        </Suspense>
    );
}
