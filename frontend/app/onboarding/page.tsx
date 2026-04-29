'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import TopicManager from '@/components/TopicManager';
import api from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4 | 5;

interface VoiceProfileResult {
    voiceDescription: string;
    toneTags: string[];
    openingStyle: string;
    sentenceLength: string;
    avgWordCount: number;
    usesEmoji: boolean;
    usesBulletPoints: boolean;
}

/* ─── Constants ─────────────────────────────────────────────── */
const MIN_POSTS = 3;

const ANALYSIS_MESSAGES = [
    'Reading your writing style…',
    'Identifying your tone patterns…',
    'Mapping your vocabulary…',
    'Building your voice profile…',
    'Finalising your fingerprint…',
];

const TONE_PALETTE = [
    { bg: '#EBF3FB', text: '#004182', border: '#70B5F9' },
    { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
    { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
    { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
    { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' },
    { bg: '#FFF1F2', text: '#9F1239', border: '#FDA4AF' },
];

/* ─── Progress dots ─────────────────────────────────────────── */
function ProgressDots({ current }: { current: Step }) {
    return (
        <div className="flex items-center gap-2">
            {([1, 2, 3, 4, 5] as Step[]).map((step) => (
                <motion.div
                    key={step}
                    animate={{
                        width: step === current ? 20 : 8,
                        background:
                            step < current ? '#22C55E' : step === current ? '#0A66C2' : '#E2E8F0',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="h-2 rounded-full"
                />
            ))}
        </div>
    );
}

/* ─── Count posts helper ─────────────────────────────────────── */
function countPosts(text: string): number {
    if (!text.trim()) return 0;
    return text
        .split('---')
        .map((p) => p.trim())
        .filter((p) => p.length > 20).length;
}

/* ─── Step 1: Welcome ────────────────────────────────────────── */
function StepWelcome({ onNext }: { onNext: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="text-center space-y-6"
        >
            <div className="flex justify-center">
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
                    className="relative w-20 h-20"
                >
                    <div
                        className="w-20 h-20 rounded-[18px] flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
                            boxShadow: '0 8px 32px rgba(10,102,194,0.30)',
                        }}
                    >
                        <span className="text-3xl font-black text-white">in</span>
                    </div>
                    <motion.div
                        animate={{ rotate: [0, 15, -10, 15, 0], scale: [1, 1.2, 1.1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-sm"
                        style={{ boxShadow: '0 2px 8px rgba(251,191,36,0.40)' }}
                    >
                        ✨
                    </motion.div>
                </motion.div>
            </div>

            <div className="space-y-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Let's learn how you write
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                    In the next 5 minutes, we'll build your personal voice profile. The AI will
                    study your past posts and start writing{' '}
                    <span className="font-semibold text-slate-700">exactly like you.</span>
                </p>
            </div>

            <div
                className="rounded-[12px] p-4 text-left space-y-2.5"
                style={{
                    background: 'linear-gradient(135deg, #EBF3FB 0%, #F0F9FF 100%)',
                    border: '1px solid rgba(10,102,194,0.12)',
                }}
            >
                {[
                    'AI learns your tone, rhythm, and vocabulary',
                    '3 posts generated every Monday in your voice',
                    'Gets better every time you rate a post',
                ].map((item, i) => (
                    <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-start gap-2.5"
                    >
                        <div className="w-4 h-4 rounded-full bg-linkedin flex items-center justify-center mt-0.5 shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-slate-700">{item}</span>
                    </motion.div>
                ))}
            </div>

            <button
                onClick={onNext}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] transition-all duration-150 active:scale-[0.98]"
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)' }}
            >
                Let's build my voice
                <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

/* ─── Step 2: Paste posts ────────────────────────────────────── */
function StepPastePosts({
    onNext,
    posts,
    setPosts,
}: {
    onNext: () => void;
    posts: string;
    setPosts: (v: string) => void;
}) {
    const postCount = countPosts(posts);
    const canProceed = postCount >= MIN_POSTS;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="space-y-4"
        >
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Paste your LinkedIn posts</h2>
                <p className="text-sm text-slate-500">5–15 posts gives the best voice match.</p>
            </div>

            <div className="relative">
                <textarea
                    value={posts}
                    onChange={(e) => setPosts(e.target.value)}
                    rows={10}
                    placeholder={`Paste your first post here…\n\n---\n\nPaste your second post here…\n\n---\n\nPaste your third post here…`}
                    className="w-full text-sm text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-[10px] p-4 resize-none focus:outline-none transition-shadow duration-150 placeholder:text-slate-300"
                    style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}
                    onFocus={(e) =>
                    (e.target.style.boxShadow =
                        '0 0 0 3px rgba(10,102,194,0.12), inset 0 1px 2px rgba(0,0,0,0.04)')
                    }
                    onBlur={(e) =>
                        (e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05)')
                    }
                />

                <AnimatePresence>
                    {posts.trim() && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            className="absolute top-3 right-3"
                        >
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${postCount >= MIN_POSTS
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                            >
                                {postCount} post{postCount !== 1 ? 's' : ''} detected
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-[8px] bg-slate-50 border border-slate-100">
                <span className="text-base mt-0.5">💡</span>
                <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-medium">
                        Separate each post with{' '}
                        <code className="bg-slate-200 px-1 rounded text-[11px]">---</code> on its own line
                    </p>
                    <p className="text-xs text-slate-400">
                        No past posts? Write 3 posts you'd{' '}
                        <span className="italic">want</span> to write — rough drafts are fine.
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {posts.trim() && !canProceed && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-amber-600 font-medium"
                    >
                        Add {MIN_POSTS - postCount} more post{MIN_POSTS - postCount !== 1 ? 's' : ''} to continue
                    </motion.p>
                )}
            </AnimatePresence>

            <button
                onClick={onNext}
                disabled={!canProceed}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={
                    canProceed
                        ? { boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)' }
                        : {}
                }
            >
                Analyze my voice
                <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

/* ─── Step 3: Topics ─────────────────────────────────────────── */
function StepTopics({
    onNext,
    topics,
    setTopics,
}: {
    onNext: () => void;
    topics: string[];
    setTopics: (t: string[]) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="space-y-5"
        >
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">What do you post about?</h2>
                <p className="text-sm text-slate-500">
                    Add 3–10 topics. These drive what gets generated each week.
                </p>
            </div>

            <TopicManager topics={topics} onChange={setTopics} minTopics={3} maxTopics={10} />

            <button
                onClick={onNext}
                disabled={topics.length < 3}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={
                    topics.length >= 3
                        ? { boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)' }
                        : {}
                }
            >
                Continue
                <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

/* ─── Step 4: Analyzing ──────────────────────────────────────── */
function StepAnalyzing() {
    const [msgIndex, setMsgIndex] = useState(0);

    useState(() => {
        const interval = setInterval(() => {
            setMsgIndex((i) => (i + 1) % ANALYSIS_MESSAGES.length);
        }, 1800);
        return () => clearInterval(interval);
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 space-y-8"
        >
            {/* Pulsing orb */}
            <div className="relative flex items-center justify-center w-24 h-24">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{ background: 'rgba(10,102,194,0.10)' }}
                        animate={{
                            width: [48, 80 + i * 16, 48],
                            height: [48, 80 + i * 16, 48],
                            opacity: [0.8, 0, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center z-10"
                    style={{
                        background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
                        boxShadow: '0 4px 24px rgba(10,102,194,0.35)',
                    }}
                >
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
            </div>

            <div className="h-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={msgIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium text-slate-600 text-center"
                    >
                        {ANALYSIS_MESSAGES[msgIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #0A66C2, #0ea5e9)' }}
                    animate={{ width: ['0%', '90%'] }}
                    transition={{ duration: 9, ease: 'easeInOut' }}
                />
            </div>

            <p className="text-xs text-slate-400">This takes about 15 seconds…</p>
        </motion.div>
    );
}

/* ─── Step 5: Profile reveal ─────────────────────────────────── */
function StepProfileReady({
    profile,
    onFinish,
}: {
    profile: VoiceProfileResult;
    onFinish: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="space-y-5"
        >
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
                >
                    <Check className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900">This is your writing voice.</h2>
                <p className="text-sm text-slate-500">
                    Your first 3 posts will arrive Monday morning. We'll email you when they're ready.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 28 }}
                className="rounded-[12px] border border-linkedin/20 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #EBF3FB 0%, #F0F9FF 100%)' }}
            >
                <div className="px-5 py-4 border-b border-linkedin/10">
                    <p className="text-xs font-semibold text-linkedin uppercase tracking-wide mb-2">
                        Your voice
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{profile.voiceDescription}"
                    </p>
                </div>

                <div className="px-5 py-4 border-b border-linkedin/10">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                        Tone
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {profile.toneTags.map((tag, i) => {
                            const c = TONE_PALETTE[i % TONE_PALETTE.length];
                            return (
                                <motion.span
                                    key={tag}
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + i * 0.06 }}
                                    className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                                    style={{ background: c.bg, color: c.text, borderColor: c.border }}
                                >
                                    {tag}
                                </motion.span>
                            );
                        })}
                    </div>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 gap-3">
                    {[
                        { label: 'Opens with', value: profile.openingStyle },
                        { label: 'Sentences', value: profile.sentenceLength },
                        { label: 'Avg words', value: String(profile.avgWordCount) },
                        {
                            label: 'Style',
                            value:
                                [profile.usesEmoji && 'Emoji', profile.usesBulletPoints && 'Bullets']
                                    .filter(Boolean)
                                    .join(' · ') || 'Clean text',
                        },
                    ].map(({ label, value }) => (
                        <div
                            key={label}
                            className="bg-white/70 rounded-[8px] px-3 py-2 border border-white/80"
                        >
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                {label}
                            </p>
                            <p className="text-sm font-semibold text-slate-800 capitalize mt-0.5">{value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            <button
                onClick={onFinish}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] transition-all duration-150 active:scale-[0.98]"
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 4px 16px rgba(10,102,194,0.28)' }}
            >
                Go to my dashboard
                <ChevronRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [rawPosts, setRawPosts] = useState('');
    const [topics, setTopics] = useState<string[]>([]);
    const [profile, setProfile] = useState<VoiceProfileResult | null>(null);

    const goNext = useCallback(() => {
        setStep((s) => (Math.min(s + 1, 5) as Step));
    }, []);

    const handleStartAnalysis = useCallback(async () => {
        setStep(4);
        try {
            const samplePosts = rawPosts
                .split('---')
                .map((p) => p.trim())
                .filter((p) => p.length > 20);

            const res = await api.post('/api/voice/analyze', { samplePosts, topics });
            setProfile(res.data.data);
            setStep(5);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Analysis failed. Please try again.');
            setStep(3);
        }
    }, [rawPosts, topics]);

    const handleFinish = useCallback(async () => {
        try {
            await api.patch('/api/auth/me', { settings: { onboardingCompleted: true } });
        } catch {
            // non-fatal
        }
        router.push('/dashboard');
    }, [router]);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{
                background: 'linear-gradient(160deg, #F8FAFC 0%, #EBF3FB 50%, #F0F9FF 100%)',
            }}
        >
            <motion.div
                layout
                className="w-full max-w-md bg-white/85 rounded-[16px] border border-slate-200/80 p-7"
                style={{
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow:
                        '0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(10,102,194,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
            >
                {/* Top bar */}
                <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-[5px] flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)' }}
                        >
                            <span className="text-white text-[10px] font-black">V</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                            VoicePost
                        </span>
                    </div>
                    <ProgressDots current={step} />
                </div>

                {/* Steps */}
                <AnimatePresence mode="wait">
                    {step === 1 && <StepWelcome key="s1" onNext={goNext} />}
                    {step === 2 && (
                        <StepPastePosts key="s2" onNext={goNext} posts={rawPosts} setPosts={setRawPosts} />
                    )}
                    {step === 3 && (
                        <StepTopics key="s3" onNext={handleStartAnalysis} topics={topics} setTopics={setTopics} />
                    )}
                    {step === 4 && <StepAnalyzing key="s4" />}
                    {step === 5 && profile && (
                        <StepProfileReady key="s5" profile={profile} onFinish={handleFinish} />
                    )}
                </AnimatePresence>
            </motion.div>

            {step !== 4 && (
                <p className="mt-4 text-xs text-slate-400">Step {step} of 5</p>
            )}
        </div>
    );
}