'use client';

import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Zap,
  Star,
  Rocket,
  Globe,
  Loader2,
  Sparkles,
  ChevronRight,
  ImageIcon,
  BarChart2,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useUser } from '@/hooks/useUser';

/* ─── Types ──────────────────────────────────────────────────── */
type Tier = 'starter' | 'pro' | 'scale' | 'global';

interface PlanConfig {
  tier: Tier;
  name: string;
  price: string;
  period: string;
  posts: number;
  icon: React.ReactNode;
  features: string[];
  lockedFeatures?: string[];  // features greyed out / shown as coming-soon
  highlight: boolean;
  badge?: string;
  color: {
    bg: string;
    border: string;
    badge: string;
    badgeText: string;
    iconBg: string;
    ring?: string;
  };
}

/* ─── Plan definitions ───────────────────────────────────────── */
const PLANS: PlanConfig[] = [
  {
    tier: 'starter',
    name: 'Starter',
    price: '₹999',
    period: '/month',
    posts: 2,
    icon: <Zap className="w-4 h-4" />,
    highlight: false,
    color: {
      bg: '#FFFFFF',
      border: '#E2E8F0',
      badge: '#F1F5F9',
      badgeText: '#475569',
      iconBg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
    },
    features: [
      '2 posts per week',
      'AI voice profile',
      'Approve & edit posts',
      'LinkedIn share links',
      '7-day free trial',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '₹1,999',
    period: '/month',
    posts: 3,
    icon: <Star className="w-4 h-4" />,
    highlight: true,
    badge: 'Most Popular',
    color: {
      bg: '#F8FBFF',
      border: '#0A66C2',
      badge: '#0A66C2',
      badgeText: '#FFFFFF',
      iconBg: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
      ring: '0 0 0 3px rgba(10,102,194,0.12)',
    },
    features: [
      '3 posts per week',
      'Full AI voice profile',
      'Performance tracker',
      'Voice score feedback loop',
      'Priority support',
      '7-day free trial',
    ],
  },
  {
    tier: 'scale',
    name: 'Scale',
    price: '₹4,999',
    period: '/month',
    posts: 5,
    icon: <Rocket className="w-4 h-4" />,
    highlight: false,
    badge: 'Best Value',
    color: {
      bg: '#FDFAFF',
      border: '#7C3AED',
      badge: '#7C3AED',
      badgeText: '#FFFFFF',
      iconBg: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
      ring: '0 0 0 3px rgba(124,58,237,0.10)',
    },
    features: [
      '5 posts per week',
      'Full AI voice profile',
      'Performance tracker',
      '🖼️ AI image generation',
      'Voice score feedback loop',
      'Priority generation queue',
      '7-day free trial',
    ],
  },
];

/* ─── Current plan status card ───────────────────────────────── */
function CurrentPlanBadge({ tier, status, trialDaysLeft }: { tier: string | null; status: string; trialDaysLeft: number | null }) {
  if (status === 'none') return null;

  const planNames: Record<string, string> = {
    starter: 'Starter', pro: 'Pro', scale: 'Scale', global: 'Global',
  };

  const statusStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    trial:     { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
    active:    { bg: '#F0FDF4', border: '#86EFAC', text: '#166534', dot: '#22C55E' },
    cancelled: { bg: '#F8FAFC', border: '#CBD5E1', text: '#475569', dot: '#94A3B8' },
    expired:   { bg: '#FFF1F2', border: '#FCA5A5', text: '#9F1239', dot: '#EF4444' },
  };

  const s = statusStyles[status] ?? statusStyles.cancelled;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="rounded-[12px] px-5 py-4 flex items-center justify-between gap-4"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: s.text }}>
            {status === 'trial'
              ? `Free trial${trialDaysLeft !== null ? ` — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left` : ''}`
              : status === 'active'
              ? `${planNames[tier ?? ''] ?? tier ?? 'Active'} plan — Active`
              : status === 'cancelled'
              ? `${planNames[tier ?? ''] ?? 'Plan'} — Cancelled`
              : 'Plan expired'}
          </p>
          <p className="text-xs mt-0.5 opacity-70" style={{ color: s.text }}>
            {status === 'trial'
              ? 'Upgrade anytime to keep full access'
              : status === 'active'
              ? 'Your subscription is active. Cancel anytime.'
              : 'Choose a plan below to restore access'}
          </p>
        </div>
      </div>
      {status === 'active' && tier && (
        <Crown className="w-4 h-4 shrink-0" style={{ color: s.dot }} />
      )}
    </motion.div>
  );
}

/* ─── Plan card ──────────────────────────────────────────────── */
function PlanCard({
  plan,
  isCurrentPlan,
  isSubscribed,
  onSelect,
  isLoading,
}: {
  plan: PlanConfig;
  isCurrentPlan: boolean;
  isSubscribed: boolean;
  onSelect: (tier: Tier) => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      whileHover={!isCurrentPlan ? { y: -2 } : {}}
      className="relative flex flex-col h-full rounded-[16px] p-5"
      style={{
        background: plan.color.bg,
        border: `${isCurrentPlan ? '2px' : '1.5px'} solid ${isCurrentPlan ? plan.color.border : plan.highlight ? plan.color.border : '#E2E8F0'}`,
        boxShadow: isCurrentPlan
          ? plan.color.ring ?? '0 0 0 3px rgba(10,102,194,0.10)'
          : plan.highlight
          ? '0 4px 20px rgba(10,102,194,0.12)'
          : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Badge */}
      {(plan.badge || isCurrentPlan) && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap"
          style={{
            background: isCurrentPlan ? plan.color.border : plan.color.badge,
            color: isCurrentPlan ? plan.color.badgeText : plan.color.badgeText,
          }}
        >
          {isCurrentPlan ? '✓ Current Plan' : plan.badge}
        </div>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0"
          style={{ background: plan.color.iconBg }}
        >
          {plan.icon}
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">{plan.name}</p>
          <p className="text-xs text-slate-500">{plan.posts} posts/week</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        <span className="text-3xl font-black text-slate-900 tracking-tight">{plan.price}</span>
        <span className="text-sm text-slate-500 ml-1">{plan.period}</span>
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-1 mb-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrentPlan ? (
        <div
          className="w-full py-2.5 rounded-[8px] text-sm font-semibold text-center"
          style={{ background: `${plan.color.border}15`, color: plan.color.border }}
        >
          Current Plan
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan.tier)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white rounded-[8px] transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
          style={{
            background: plan.highlight
              ? 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)'
              : plan.tier === 'scale'
              ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
              : 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
            boxShadow: plan.highlight
              ? '0 2px 8px rgba(10,102,194,0.30)'
              : plan.tier === 'scale'
              ? '0 2px 8px rgba(124,58,237,0.30)'
              : 'none',
          }}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              {isSubscribed ? 'Switch to this plan' : 'Start 7-day free trial'}
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}

/* ─── Feature comparison row ─────────────────────────────────── */
function FeatureRow({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
  return (
    <div
      className="px-4 py-3 rounded-[10px] bg-white border border-slate-100 flex items-start gap-3"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 mt-0.5 text-linkedin"
        style={{ background: 'linear-gradient(135deg, #EBF3FB 0%, #F0F9FF 100%)', border: '1px solid rgba(10,102,194,0.10)' }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-800 mb-0.5">{label}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

/* ─── Global tier note ───────────────────────────────────────── */
function GlobalTierNote() {
  const [loading, setLoading] = useState(false);
  const handleGlobal = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/billing/create-subscription', { tier: 'global' });
      const { checkoutUrl } = res.data.data;
      window.location.href = checkoutUrl;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not initiate checkout.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] bg-white border border-slate-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
      <p className="text-sm text-slate-600">
        Billing in USD?{' '}
        <button
          onClick={handleGlobal}
          disabled={loading}
          className="font-semibold text-linkedin hover:text-linkedin-hover transition-colors duration-150 disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Switch to $29/month Global plan →'}
        </button>
      </p>
    </motion.div>
  );
}

/* ─── Main page content ──────────────────────────────────────── */
function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const requestedTier = searchParams.get('tier') as Tier | null;

  const { user, isLoading: userLoading, trialDaysLeft, isSubscribed: subscribed } = useUser();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const currentTier = user?.subscriptionTier as Tier | null;
  const subStatus = user?.subscriptionStatus ?? 'none';

  const handleSelectPlan = async (tier: Tier) => {
    setLoadingTier(tier);
    try {
      const res = await api.post('/api/billing/create-subscription', { tier });
      const { checkoutUrl, mode } = res.data.data;
      if (mode === 'development') {
        toast.success(`Dev mode: ${tier} plan activated!`, { description: 'Redirecting to dashboard…' });
        setTimeout(() => { window.location.href = checkoutUrl; }, 1200);
      } else {
        window.location.href = checkoutUrl;
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not initiate checkout. Try again.'));
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-slate-200/80"
        style={{ background: 'rgba(248,250,252,0.90)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold text-slate-900">Plans & Billing</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Current plan status */}
        {!userLoading && user && (
          <CurrentPlanBadge
            tier={currentTier}
            status={subStatus}
            trialDaysLeft={trialDaysLeft}
          />
        )}

        {reason === 'trial_ended' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="rounded-[12px] px-5 py-4"
            style={{ background: '#FFF7ED', border: '1px solid #FDBA74' }}
          >
            <p className="text-sm font-semibold text-amber-900">
              Your current plan does not cover that feature.
            </p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Upgrade to continue using subscription-gated features like advanced analytics,
              higher weekly post limits, or AI image generation.
            </p>
          </motion.div>
        )}

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="text-center space-y-1.5"
        >
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {subscribed ? 'Change your plan' : 'Choose your plan'}
          </h2>
          <p className="text-sm text-slate-500">
            {subscribed ? 'Upgrade or downgrade anytime.' : 'All plans include a 7-day free trial. Cancel anytime.'}
          </p>
        </motion.div>

        {/* Plan cards */}
        {userLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[16px] border border-slate-200 bg-white p-5 space-y-4">
                <div className="skeleton h-9 w-9 rounded-[10px]" />
                <div className="skeleton h-6 w-24" />
                <div className="skeleton h-8 w-20" />
                <div className="space-y-2 pt-2">
                  {[0, 1, 2, 3].map((j) => <div key={j} className="skeleton h-4 w-full" />)}
                </div>
                <div className="skeleton h-10 w-full rounded-[8px]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: i * 0.08 }}
                className="flex flex-col"
              >
                <PlanCard
                  plan={plan}
                  isCurrentPlan={currentTier === plan.tier && subscribed}
                  isSubscribed={subscribed}
                  onSelect={handleSelectPlan}
                  isLoading={loadingTier === plan.tier}
                />
                {requestedTier === plan.tier && (
                  <p className="text-center text-xs text-linkedin font-semibold mt-2">
                    Recommended for your current checkout flow
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <FeatureRow
            icon={<Sparkles className="w-3.5 h-3.5" />}
            label="AI voice profile"
            detail="Learns from your past posts. Gets smarter over time."
          />
          <FeatureRow
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            label="Performance tracker"
            detail="See which topics and hooks get the most engagement."
          />
          <FeatureRow
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            label="AI image generation"
            detail="Scale & Global: auto-generate post cover images with AI."
          />
        </motion.div>

        {/* Global tier note */}
        <GlobalTierNote />

        {/* Fine print */}
        <p className="text-center text-xs text-slate-400">
          Billed monthly. No contracts. Cancel anytime from Settings.{' '}
          <a href="/privacy" className="underline hover:text-slate-600 transition-colors">Privacy</a>
          {' · '}
          <a href="/terms" className="underline hover:text-slate-600 transition-colors">Terms</a>
        </p>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageContent />
    </Suspense>
  );
}
