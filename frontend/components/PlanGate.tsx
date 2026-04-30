'use client';

import { motion } from 'framer-motion';
import { Lock, ChevronRight } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

type RequiredPlan = 'pro' | 'scale';

const PLAN_LABELS: Record<RequiredPlan, { name: string; price: string; color: string }> = {
    pro: { name: 'Pro', price: '₹1,999/mo', color: '#0A66C2' },
    scale: { name: 'Scale', price: '₹4,999/mo', color: '#7C3AED' },
};

const PLAN_RANK: Record<string, number> = {
    none: 0, trial: 1, starter: 1, pro: 2, global: 2, scale: 3,
};

interface PlanGateProps {
    requiredPlan: RequiredPlan;
    feature: string;             // e.g. "Performance tracker"
    children?: React.ReactNode;
    inline?: boolean;            // true = inline lock overlay, false = replace with upgrade card
}

export default function PlanGate({
    requiredPlan,
    feature,
    children,
    inline = false,
}: PlanGateProps) {
    const { planKey, isLoading } = useUser();

    if (isLoading) return children ? <>{children}</> : null;

    const userRank = PLAN_RANK[planKey] ?? 0;
    const requiredRank = PLAN_RANK[requiredPlan] ?? 99;
    const hasAccess = userRank >= requiredRank;

    if (hasAccess) return children ? <>{children}</> : null;

    const plan = PLAN_LABELS[requiredPlan];

    if (inline) {
        // Overlay variant — wraps children with a blur + lock badge
        return (
            <div className="relative">
                <div className="pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.4 }}>
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <a
                        href="/billing"
                        className="flex items-center gap-2 py-2 px-4 rounded-[8px] text-sm font-semibold text-white shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}CC 100%)`,
                            boxShadow: `0 2px 8px ${plan.color}40, 0 4px 16px rgba(0,0,0,0.12)`,
                        }}
                    >
                        <Lock className="w-3.5 h-3.5" />
                        {plan.name} plan required
                        <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        );
    }

    // Card variant — replaces content entirely
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="rounded-[12px] border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center space-y-3"
        >
            <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto"
                style={{
                    background: `linear-gradient(135deg, ${plan.color}18 0%, ${plan.color}10 100%)`,
                    border: `1px solid ${plan.color}20`,
                }}
            >
                <Lock className="w-4 h-4" style={{ color: plan.color }} />
            </div>

            <div>
                <p className="text-sm font-semibold text-slate-800">{feature}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                    Available on the <span className="font-semibold" style={{ color: plan.color }}>{plan.name}</span> plan
                    {' '}at {plan.price}
                </p>
            </div>

            <a
                href="/billing"
                className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-[6px] text-xs font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                style={{
                    background: plan.color,
                    boxShadow: `0 1px 2px rgba(0,0,0,0.10), 0 2px 6px ${plan.color}30`,
                }}
            >
                Upgrade to {plan.name}
                <ChevronRight className="w-3 h-3" />
            </a>
        </motion.div>
    );
}