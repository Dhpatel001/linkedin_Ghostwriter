'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ChevronRight } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export default function TrialBanner() {
    const { isOnTrial, isExpired, trialDaysLeft } = useUser();
    const [dismissed, setDismissed] = useState(false);

    // Don't show if dismissed, not on trial/expired, or trial has plenty of time
    if (dismissed) return null;
    if (!isOnTrial && !isExpired) return null;
    // Only show trial banner when ≤ 3 days remain or expired
    if (isOnTrial && trialDaysLeft !== null && trialDaysLeft > 3) return null;

    const isTrialExpired = isExpired;
    const isLastDay = trialDaysLeft === 0 || trialDaysLeft === 1;

    const bg = isTrialExpired ? '#FEF2F2' : isLastDay ? '#FFF7ED' : '#FFFBEB';
    const border = isTrialExpired ? '#FCA5A5' : isLastDay ? '#FDBA74' : '#FDE047';
    const icon = isTrialExpired ? 'text-red-500' : 'text-amber-500';
    const text = isTrialExpired ? 'text-red-800' : 'text-amber-800';
    const sub = isTrialExpired ? 'text-red-600' : 'text-amber-700';

    const headline = isTrialExpired
        ? 'Your free trial has ended'
        : trialDaysLeft === 0
            ? 'Your trial ends today'
            : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in your trial`;

    const subline = isTrialExpired
        ? 'Subscribe now to keep generating posts in your voice.'
        : 'Subscribe to keep your voice profile and weekly posts.';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="flex items-center gap-3 px-4 py-2.5 border-b"
                style={{ background: bg, borderColor: border, borderBottomWidth: 1 }}
            >
                <AlertTriangle className={`w-4 h-4 shrink-0 ${icon}`} />

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-3 min-w-0">
                    <p className={`text-xs font-semibold ${text}`}>{headline}</p>
                    <p className={`text-xs ${sub} hidden sm:block`}>·</p>
                    <p className={`text-xs ${sub}`}>{subline}</p>
                </div>

                <a
                    href="/billing"
                    className="flex items-center gap-1 text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-80"
                    style={{ color: isTrialExpired ? '#991B1B' : '#92400E' }}
                >
                    View plans
                    <ChevronRight className="w-3 h-3" />
                </a>

                {!isTrialExpired && (
                    <button
                        onClick={() => setDismissed(true)}
                        className="ml-1 p-1 rounded hover:bg-black/10 transition-colors duration-150 shrink-0"
                        aria-label="Dismiss"
                    >
                        <X className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}