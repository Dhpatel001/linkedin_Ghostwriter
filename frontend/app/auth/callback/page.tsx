'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const next = searchParams.get('next');
        const intent = searchParams.get('intent');
        const tier = searchParams.get('tier');

        // Redirect based on intent
        if (next && next.startsWith('/') && !next.startsWith('//')) {
            router.replace(next);
        } else if (intent === 'subscribe') {
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
