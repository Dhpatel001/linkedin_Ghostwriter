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
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useUser } from '@/hooks/useUser';

/* ─── Types ─────────────────────────────────────────────────── */
type Tier = 'starter' | 'pro' | 'scale' | 'global';

interface PlanConfig {
  tier: Tier;
  name: string;
  price: string;
  period: string;
  posts: number;
  icon: React.ReactNode;
  features: string[];
  highlight: boolean;
  badge?: string;
  color: {
    bg: string;
    border: string;
    badge: string;
    badgeText: string;
    iconBg: string;
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
      'Voice profile',
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
    },
    features: [
      '3 posts per week',
      'Full voice profile',
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
    color: {
      bg: '#FFFFFF',
      border: '#E2E8F0',
      badge: '#F1F5F9',
      badgeText: '#475569',
      iconBg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
    },
    features: [
      '5 posts per week',
      'Full voice profile',
      'Performance tracker',
      'Priority generation',
      'Advanced analytics',
      '7-day free trial',
    ],
  },
];

/* ─── Helpers ───────────────────────────────────────────────── */
/* ─── Trial banner ───────────────────────────────────────────── */
function TrialBanner({ daysLeft, reason }: { daysLeft: number | null; reason: string | null }) {
  if (!daysLeft && reason !== 'trial_ended') return null;

  const isExpired = reason === 'trial_ended' || daysLeft === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="rounded-[12px] p-4 flex items-start gap-3"
      style={{
        background: isExpired
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)'
          : 'linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%)',
        border: `1px solid ${isExpired ? '#FCA5A5' : '#FDE047'}`,
      }}
    >
      <AlertTriangle
        className={`w-4 h-4 mt-0.5 shrink-0 ${isExpired ? 'text-red-500' : 'text-amber-500'}`}
      />
      <div>
        <p className={`text-sm font-semibold ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
          {isExpired
            ? 'Your free trial has ended'
            : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your trial`}
        </p>
        <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-600' : 'text-amber-700'}`}>
          {isExpired
            ? 'Subscribe to continue generating posts in your voice.'
            : 'Subscribe now to keep your voice profile and weekly posts.'}
        </p>
      </div>
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
  const c = plan.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="relative flex flex-col rounded-[14px] border overflow-hidden"
      style={{
        background: c.bg,
        borderColor: c.border,
        borderWidth: plan.highlight ? 2 : 1,
        boxShadow: plan.highlight
          ? '0 4px 6px rgba(0,0,0,0.06), 0 16px 48px rgba(10,102,194,0.12)'
          : '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Most Popular badge */}
      {plan.badge && (
        <div
          className="absolute top-0 right-0 px-3 py-1 text-[11px] font-bold rounded-bl-[10px] rounded-tr-[12px]"
          style={{ background: c.badge, color: c.badgeText }}
        >
          {plan.badge}
        </div>
      )}

      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
            style={{
              background: c.iconBg,
              color: plan.highlight ? '#FFFFFF' : '#0A66C2',
              boxShadow: plan.highlight
                ? '0 2px 8px rgba(10,102,194,0.25)'
                : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {plan.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
            <p className="text-xs text-slate-500">{plan.posts} posts/week</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {plan.price}
          </span>
          <span className="text-sm text-slate-400">{plan.period}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 mx-5" />

      {/* Features */}
      <div className="px-5 py-4 flex-1">
        <ul className="space-y-2.5">
          {plan.features.map((feat) => (
            <li key={feat} className="flex items-start gap-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                style={{
                  background: plan.highlight ? '#0A66C2' : '#F1F5F9',
                }}
              >
                <Check
                  className="w-2.5 h-2.5"
                  strokeWidth={3}
                  style={{ color: plan.highlight ? '#FFFFFF' : '#64748B' }}
                />
              </div>
              <span className="text-sm text-slate-600">{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        {isCurrentPlan ? (
          <div
            className="w-full py-2.5 rounded-[8px] text-sm font-semibold text-center border"
            style={{
              background: '#F0FDF4',
              borderColor: '#86EFAC',
              color: '#166534',
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              Current plan
            </span>
          </div>
        ) : (
          <button
            onClick={() => onSelect(plan.tier)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={
              plan.highlight
                ? {
                    background: '#0A66C2',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)',
                  }
                : {
                    background: '#F8FAFC',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                  }
            }
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {isSubscribed ? 'Switch to this plan' : 'Start 7-day free trial'}
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
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

/* ─── Main Page ──────────────────────────────────────────────── */
function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const { user, isLoading: userLoading, trialDaysLeft, isSubscribed: subscribed } = useUser();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const currentTier = user?.subscriptionTier as Tier | null;

  const handleSelectPlan = async (tier: Tier) => {
    setLoadingTier(tier);
    try {
      const res = await api.post('/api/billing/create-subscription', { tier });
      const { checkoutUrl } = res.data.data;
      // Redirect to Razorpay hosted checkout
      window.location.href = checkoutUrl;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not initiate checkout. Try again.'));
      setLoadingTier(null);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-slate-200/80"
        style={{
          background: 'rgba(248,250,252,0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
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

      {/* Page content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Trial / expiry banner */}
        {!userLoading && (
          <TrialBanner daysLeft={trialDaysLeft} reason={reason} />
        )}

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="text-center space-y-2"
        >
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Upgrade your plan
          </h2>
          <p className="text-sm text-slate-500">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
        </motion.div>

        {/* Plan cards */}
        {userLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[14px] border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="skeleton h-9 w-9 rounded-[8px]" />
                <div className="skeleton h-6 w-24" />
                <div className="skeleton h-8 w-20" />
                <div className="space-y-2 pt-2">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="skeleton h-4 w-full" />
                  ))}
                </div>
                <div className="skeleton h-10 w-full rounded-[8px]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 28,
                  delay: i * 0.08,
                }}
              >
                <PlanCard
                  plan={plan}
                  isCurrentPlan={currentTier === plan.tier && subscribed}
                  isSubscribed={subscribed}
                  onSelect={handleSelectPlan}
                  isLoading={loadingTier === plan.tier}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Feature comparison note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {[
            { label: 'Voice profile', detail: 'Learns from your past posts. Gets smarter over time.' },
            { label: 'Performance tracker', detail: 'See which topics and hooks get the most engagement.' },
            { label: 'Voice score loop', detail: 'Rate each post 1–10. AI adapts to your feedback.' },
          ].map((item) => (
            <div
              key={item.label}
              className="px-4 py-3 rounded-[10px] bg-white border border-slate-100"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <p className="text-xs font-semibold text-slate-800 mb-1">{item.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </motion.div>

        {/* Global tier */}
        <GlobalTierNote />

        {/* Fine print */}
        <p className="text-center text-xs text-slate-400">
          Billed monthly. No contracts. Cancel anytime from Settings.{' '}
          <a href="/privacy" className="underline hover:text-slate-600 transition-colors">
            Privacy
          </a>{' '}
          ·{' '}
          <a href="/terms" className="underline hover:text-slate-600 transition-colors">
            Terms
          </a>
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
