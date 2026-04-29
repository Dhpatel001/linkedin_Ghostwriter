'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Star,
  Zap,
  Rocket,
  Globe,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
type Tier = 'starter' | 'pro' | 'scale';

/* ─── Nav ────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.nav
      animate={{
        boxShadow: scrolled
          ? '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)'
          : 'none',
      }}
      transition={{ duration: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/0"
      style={{
        background: scrolled ? 'rgba(248,250,252,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottomColor: scrolled ? 'rgba(226,232,240,0.8)' : 'transparent',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-[6px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
              boxShadow: '0 2px 6px rgba(10,102,194,0.30)',
            }}
          >
            <span className="text-white text-xs font-black">V</span>
          </div>
          <span className="text-sm font-bold text-slate-900">VoicePost</span>
        </div>

        {/* CTA */}
        <a
          href="/api/auth/linkedin"
          className="flex items-center gap-1.5 py-1.5 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(10,102,194,0.20)' }}
        >
          Get started free
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function Hero() {
  const [authLoading, setAuthLoading] = useState(false);

  const handleOAuth = () => {
    setAuthLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/linkedin`;
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, #F8FAFC 0%, #EBF3FB 45%, #F0F9FF 100%)',
      }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(10,102,194,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">

        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{
            background: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(10,102,194,0.20)',
            color: '#004182',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            style={{ boxShadow: '0 0 0 3px rgba(34,197,94,0.20)' }}
          />
          Join the waitlist — free for first 100
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.15 }}
          className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] text-balance"
        >
          LinkedIn posts that sound{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            exactly like you.
          </span>
          <br />
          3 per week. Zero effort.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.22 }}
          className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-lg mx-auto"
        >
          Stop meaning to post. Let AI learn your voice — founders, consultants,
          and coaches use VoicePost to grow their LinkedIn without writing.
        </motion.p>

        {/* CTA group */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.30 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={handleOAuth}
            disabled={authLoading}
            className="flex items-center gap-2 py-3 px-6 text-sm font-bold text-white rounded-[8px] transition-all duration-150 active:scale-[0.98] disabled:opacity-70"
            style={{
              background: '#0A66C2',
              boxShadow:
                '0 2px 4px rgba(0,0,0,0.14), 0 6px 24px rgba(10,102,194,0.32)',
            }}
          >
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {authLoading ? 'Redirecting…' : 'Start free — no credit card'}
            {!authLoading && <ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-xs text-slate-400">
            7-day free trial · Cancel anytime
          </p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 pt-2"
        >
          <div className="flex -space-x-2">
            {['#0A66C2', '#8B5CF6', '#059669', '#F59E0B'].map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: color }}
              >
                {['F', 'C', 'S', 'A'][i]}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Join 200+ professionals</span>{' '}
            growing on LinkedIn
          </p>
        </motion.div>
      </div>

      {/* Mock dashboard preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 16 }}
        transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.5 }}
        className="relative z-10 w-full max-w-2xl mx-auto mt-12"
      >
        <div
          className="rounded-[16px] border border-slate-200 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(12px)',
            boxShadow:
              '0 4px 6px rgba(0,0,0,0.04), 0 24px 64px rgba(10,102,194,0.12)',
          }}
        >
          {/* Mock header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <div className="flex gap-1.5">
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="flex-1 mx-4 h-5 bg-slate-100 rounded-md text-[11px] text-slate-400 flex items-center justify-center">
              voicepost.in/dashboard
            </div>
          </div>

          {/* Mock post cards */}
          <div className="p-4 space-y-3">
            {[
              {
                topic: 'Founder lessons',
                hook: '3 things I wish someone told me before my first hire.',
                preview:
                  "We hired too fast. I thought scaling the team meant scaling the product. It doesn't. Here's what I learned the hard way…",
                color: '#86EFAC',
              },
              {
                topic: 'Startup failures',
                hook: 'We ran out of runway with 11 users. Here\'s what I\'d do differently.',
                preview:
                  'The deck was beautiful. The product was real. The market timing was off by 18 months. I\'ve spent two years thinking about this…',
                color: '#70B5F9',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.12 }}
                className="rounded-[10px] border border-slate-100 p-3.5 bg-white"
                style={{ borderLeft: `3px solid ${card.color}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-linkedin-light text-linkedin-hover border border-linkedin/15">
                    {card.topic}
                  </span>
                  <span className="text-[10px] text-slate-400">2 hours ago</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mb-1 leading-snug">
                  {card.hook}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {card.preview}
                </p>
                <div className="flex gap-1.5 mt-2.5">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-[4px] bg-linkedin text-white">
                    ✓ Approve
                  </span>
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-[4px] bg-slate-100 text-slate-500">
                    ✎ Edit
                  </span>
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-[4px] bg-slate-100 text-slate-500">
                    ✗ Discard
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Glow under card */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse, rgba(10,102,194,0.18) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
      </motion.div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Connect LinkedIn + paste past posts',
      body: 'Log in with LinkedIn in one click. Then paste 5–15 of your past posts — the AI reads how you write, not just what you write.',
      icon: '🔗',
      color: '#EBF3FB',
      border: 'rgba(10,102,194,0.15)',
    },
    {
      step: '02',
      title: 'AI learns your voice in 60 seconds',
      body: 'Your tone, sentence rhythm, vocabulary, opening style — it\'s all extracted and stored as your personal voice profile.',
      icon: '🧠',
      color: '#F0FDF4',
      border: 'rgba(34,197,94,0.15)',
    },
    {
      step: '03',
      title: '3 posts arrive every Monday. Approve. Post. Done.',
      body: 'Every Monday morning, 3 posts land in your dashboard. Review them, rate how well they sound like you, and share directly to LinkedIn.',
      icon: '📬',
      color: '#FEF9C3',
      border: 'rgba(234,179,8,0.15)',
    },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold text-linkedin uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Three steps. One hour a month.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 28,
                delay: i * 0.1,
              }}
              className="rounded-[14px] p-5 border"
              style={{
                background: s.color,
                borderColor: s.border,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="text-3xl mb-4 select-none">{s.icon}</div>
              <p className="text-xs font-bold text-slate-400 tracking-wider mb-1.5">
                STEP {s.step}
              </p>
              <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                {s.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Problem section ────────────────────────────────────────── */
function ProblemSection() {
  const pains = [
    'You open LinkedIn to post. You stare at the blank box. You close it.',
    'You have things worth saying. You just never find the time to write them.',
    'You\'ve been "meaning to post regularly" for the last 6 months.',
    'You watch peers build audiences and wonder why you can\'t do the same.',
  ];

  return (
    <section
      className="py-20 px-4"
      style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
      }}
    >
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          <p className="text-xs font-bold text-linkedin-muted uppercase tracking-widest mb-4">
            Sound familiar?
          </p>
          <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
            You know you should post on LinkedIn.
            <br />
            <span className="text-slate-400">You just never do.</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {pains.map((pain, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 28,
                delay: i * 0.08,
              }}
              className="flex items-start gap-3 text-left py-3 px-4 rounded-[10px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-slate-500 text-base mt-0.5 shrink-0">—</span>
              <p className="text-sm text-slate-300 leading-relaxed">{pain}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-sm text-slate-400 leading-relaxed"
        >
          Blank page syndrome is real. VoicePost eliminates it.
          <br />
          <span className="text-white font-semibold">
            You review. You approve. You post. That's it.
          </span>
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Pricing section ────────────────────────────────────────── */
const PLANS = [
  {
    tier: 'starter' as Tier,
    name: 'Starter',
    price: '₹999',
    posts: 2,
    icon: <Zap className="w-4 h-4" />,
    highlight: false,
    features: ['2 posts/week', 'Voice profile', 'Approve & edit', 'LinkedIn share'],
    iconBg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
    iconColor: '#64748B',
  },
  {
    tier: 'pro' as Tier,
    name: 'Pro',
    price: '₹1,999',
    posts: 3,
    icon: <Star className="w-4 h-4" />,
    highlight: true,
    badge: 'Most Popular',
    features: ['3 posts/week', 'Full voice profile', 'Performance tracker', 'Voice score loop', 'Priority support'],
    iconBg: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
    iconColor: '#FFFFFF',
  },
  {
    tier: 'scale' as Tier,
    name: 'Scale',
    price: '₹4,999',
    posts: 5,
    icon: <Rocket className="w-4 h-4" />,
    highlight: false,
    features: ['5 posts/week', 'Full voice profile', 'Performance tracker', 'Priority generation', 'Advanced analytics'],
    iconBg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
    iconColor: '#7C3AED',
  },
];

function PricingSection() {
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const handleSelect = (tier: Tier) => {
    setLoadingTier(tier);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/linkedin?intent=subscribe&tier=${tier}`;
  };

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold text-linkedin uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Simple, honest pricing
          </h2>
          <p className="text-sm text-slate-500">
            7 days free on every plan. No credit card required to start.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 28,
                delay: i * 0.1,
              }}
              className="relative flex flex-col rounded-[14px] border overflow-hidden"
              style={{
                borderColor: plan.highlight ? '#0A66C2' : '#E2E8F0',
                borderWidth: plan.highlight ? 2 : 1,
                boxShadow: plan.highlight
                  ? '0 4px 6px rgba(0,0,0,0.06), 0 16px 48px rgba(10,102,194,0.12)'
                  : '0 1px 3px rgba(0,0,0,0.05)',
                background: plan.highlight ? '#F8FBFF' : '#FFFFFF',
              }}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-linkedin text-white text-[10px] font-bold px-3 py-1 rounded-bl-[10px] rounded-tr-[12px]">
                  {plan.badge}
                </div>
              )}

              <div className="px-5 pt-5 pb-4">
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-4"
                  style={{
                    background: plan.iconBg,
                    color: plan.iconColor,
                    boxShadow: plan.highlight ? '0 2px 8px rgba(10,102,194,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  {plan.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
              </div>

              <div className="h-px bg-slate-100 mx-5" />

              <ul className="px-5 py-4 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                      style={{ background: plan.highlight ? '#0A66C2' : '#F1F5F9' }}
                    >
                      <Check
                        className="w-2.5 h-2.5"
                        strokeWidth={3}
                        style={{ color: plan.highlight ? '#fff' : '#64748B' }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="px-5 pb-5">
                <button
                  onClick={() => handleSelect(plan.tier)}
                  disabled={loadingTier === plan.tier}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-70"
                  style={
                    plan.highlight
                      ? { background: '#0A66C2', color: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)' }
                      : { background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0' }
                  }
                >
                  {loadingTier === plan.tier ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Start 7-day free trial <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-5 flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] bg-slate-50 border border-slate-100"
        >
          <Globe className="w-4 h-4 text-slate-400" />
          <p className="text-sm text-slate-500">
            Billing in USD?{' '}
            <a href="/billing" className="font-semibold text-linkedin hover:underline">
              Switch to $29/month Global plan →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="py-10 px-4 border-t border-slate-100 bg-white">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-[5px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)' }}
          >
            <span className="text-white text-[10px] font-black">V</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">VoicePost</span>
          <span className="text-xs text-slate-400 ml-1">© 2024</span>
        </div>
        <div className="flex items-center gap-5">
          {['Privacy', 'Terms', 'Contact'].map((item) => (
            <a
              key={item}
              href={`/${item.toLowerCase()}`}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors duration-150"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <HowItWorks />
      <ProblemSection />
      <PricingSection />
      <Footer />
    </div>
  );
}