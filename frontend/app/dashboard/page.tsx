'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, Settings, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PostCard from '@/components/PostCard';
import StreakTracker from '@/components/StreakTracker';
import TrialBanner from '@/components/TrialBanner';
import PlanGate from '@/components/PlanGate';
import { useUser } from '@/hooks/useUser';
import { usePosts, Post } from '@/hooks/usePosts';
import { useVoiceProfile } from '@/hooks/useVoiceProfile';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

type ActiveTab = 'pending' | 'approved' | 'posted';
interface PerformanceData { impressions?: number; likes?: number; comments?: number; shares?: number; }

/* ─── Streak calc ────────────────────────────────────────────── */
function calcStreak(postedPosts: Post[]): number {
    if (!postedPosts.length) return 0;
    const weeks = new Set(
        postedPosts.filter((p) => p.postedAt).map((p) => {
            const d = new Date(p.postedAt!);
            const day = d.getDay() || 7;
            d.setDate(d.getDate() + 4 - day);
            const ys = new Date(d.getFullYear(), 0, 1);
            const wk = Math.ceil(((d.getTime() - ys.getTime()) / 86400000 + 1) / 7);
            return `${d.getFullYear()}-W${wk}`;
        })
    );
    if (!weeks.size) return 0;
    const sorted = Array.from(weeks).sort().reverse();
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const [yr, wk] = sorted[i - 1].split('-W').map(Number);
        const [pYr, pWk] = sorted[i].split('-W').map(Number);
        const exp = wk === 1 ? `${yr - 1}-W52` : `${yr}-W${wk - 1}`;
        if (`${pYr}-W${pWk}` === exp) streak++; else break;
    }
    return streak;
}

function getNextMonday() {
    const d = new Date();
    const diff = d.getDay() === 1 ? 7 : (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
}

function PostCardSkeleton() {
    return (
        <div className="rounded-[12px] border border-slate-200 bg-white/80 p-5 space-y-3">
            <div className="flex justify-between"><div className="skeleton h-5 w-24 rounded-full" /><div className="skeleton h-4 w-16" /></div>
            <div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-5/6" />
            <div className="flex gap-2 mt-2"><div className="skeleton h-8 w-24 rounded-[6px]" /><div className="skeleton h-8 w-16 rounded-[6px]" /><div className="skeleton h-8 w-16 rounded-[6px] ml-auto" /></div>
        </div>
    );
}

function EmptyState({ tab, onGenerate }: { tab: ActiveTab; onGenerate: () => void }) {
    const c = {
        pending: { icon: '📅', title: "You're all caught up", body: `Posts generate every Monday at 7:30am. Next: ${getNextMonday()}.`, cta: true },
        approved: { icon: '✅', title: 'No approved posts yet', body: 'Review your pending posts and approve the ones that sound like you.', cta: false },
        posted: { icon: '📊', title: 'Nothing posted yet', body: 'Posts you mark as published appear here.', cta: false },
    }[tab];

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }} className="text-5xl mb-4 select-none">{c.icon}</motion.div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">{c.title}</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-4">{c.body}</p>
            {c.cta && (
                <button onClick={onGenerate} className="flex items-center gap-2 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 2px 6px rgba(10,102,194,0.20)' }}>
                    <Sparkles className="w-3.5 h-3.5" />Generate one now
                </button>
            )}
        </motion.div>
    );
}

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} className={`relative flex items-center gap-2 py-2.5 px-1 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none ${active ? 'text-linkedin' : 'text-slate-500 hover:text-slate-800'}`}>
            {label}
            {count > 0 && <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${active ? 'bg-linkedin text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
            {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-linkedin rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
        </button>
    );
}

function GenerateDialog({ open, onClose, topicBuckets, onSuccess, weeklyLimit, weekPostCount }: {
    open: boolean; onClose: () => void; topicBuckets: string[];
    onSuccess: () => void; weeklyLimit: number; weekPostCount: number;
}) {
    const [selected, setSelected] = useState('');
    const [custom, setCustom] = useState('');
    const [busy, setBusy] = useState(false);
    const topic = custom.trim() || selected;
    const atLimit = weekPostCount >= weeklyLimit;

    async function handleGenerate() {
        if (!topic) { toast.error('Pick a topic or type a custom one.'); return; }
        setBusy(true);
        try {
            await api.post('/api/posts/generate', { topic });
            toast.success('Post generated!', { description: "Check the Review tab." });
            onSuccess(); onClose(); setSelected(''); setCustom('');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Generation failed. Try again.'));
        } finally { setBusy(false); }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md rounded-[14px] border border-slate-200 bg-white p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Sparkles className="w-4 h-4 text-linkedin" />Generate a post now
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 mt-1">Pick a topic from your list or type something new.</p>
                    {atLimit && (
                        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-[8px] bg-amber-50 border border-amber-100">
                            <Lock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium">
                                You&apos;ve used all {weeklyLimit} posts this week.{' '}
                                <a href="/billing" className="underline">Upgrade</a> for more.
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-5 space-y-4">
                    {topicBuckets.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Your topics</p>
                            <div className="flex flex-wrap gap-2">
                                {topicBuckets.map((t) => (
                                    <button key={t} onClick={() => { setSelected(t); setCustom(''); }} disabled={atLimit}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.96] disabled:opacity-50 ${selected === t && !custom ? 'bg-linkedin text-white border-linkedin' : 'bg-white text-slate-700 border-slate-200 hover:border-linkedin/40 hover:bg-linkedin-light hover:text-linkedin'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Or type a one-off topic</p>
                        <input value={custom} onChange={(e) => { setCustom(e.target.value); if (e.target.value) setSelected(''); }}
                            disabled={atLimit} placeholder="e.g. My biggest product launch mistake"
                            className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-[8px] px-3 py-2.5 focus:outline-none transition-shadow duration-150 placeholder:text-slate-300 disabled:opacity-50"
                            style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                            onFocus={(e) => (e.target.style.boxShadow = '0 0 0 3px rgba(10,102,194,0.12), inset 0 1px 2px rgba(0,0,0,0.04)')}
                            onBlur={(e) => (e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)')} />
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={handleGenerate} disabled={!topic || busy || atLimit}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                        style={topic && !busy && !atLimit ? { boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 2px 8px rgba(10,102,194,0.22)' } : {}}>
                        {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Sparkles className="w-3.5 h-3.5" /> Generate post</>}
                    </button>
                    <button onClick={onClose} disabled={busy} className="py-2.5 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[6px] transition-all duration-150 active:scale-[0.97]">Cancel</button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
    const [generateOpen, setGenerateOpen] = useState(false);

    const { user, isLoading: userLoading, postsPerWeek, canUsePerformanceTracker } = useUser();
    const { profile } = useVoiceProfile();

    const { posts: pendingPosts, isLoading: pendingLoading, mutate: mutatePending } = usePosts('pending');
    const { posts: approvedPosts, isLoading: approvedLoading, mutate: mutateApproved } = usePosts('approved');
    const { posts: postedPosts, isLoading: postedLoading, mutate: mutatePosted } = usePosts('posted');

    // Redirect if onboarding not done
    useEffect(() => {
        if (!userLoading && user && !user.onboardingCompleted) router.replace('/onboarding');
    }, [user, userLoading, router]);

    const streak = calcStreak(postedPosts);

    // Count this-week posts (Mon–Sun) for limit check
    const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0); return d; })();
    const weekPostCount = [...pendingPosts, ...approvedPosts, ...postedPosts]
        .filter((p) => new Date(p.generatedAt) >= weekStart).length;

    const handleApprove = async (id: string, voiceScore: number) => {
        mutatePending((c) => c?.filter((p) => p._id !== id), false);
        try { await api.patch(`/api/posts/${id}/approve`, { voiceScore }); mutatePending(); mutateApproved(); }
        catch { mutatePending(); throw new Error('failed'); }
    };
    const handleDiscard = async (id: string) => {
        mutatePending((c) => c?.filter((p) => p._id !== id), false);
        try { await api.patch(`/api/posts/${id}/discard`); mutatePending(); }
        catch { mutatePending(); throw new Error('failed'); }
    };
    const handleEdit = async (id: string, content: string) => { await api.patch(`/api/posts/${id}/edit`, { editedContent: content }); mutatePending(); mutateApproved(); };
    const handleMarkPosted = async (id: string) => {
        mutateApproved((c) => c?.filter((p) => p._id !== id), false);
        try { await api.patch(`/api/posts/${id}/posted`); mutateApproved(); mutatePosted(); }
        catch { mutateApproved(); throw new Error('failed'); }
    };
    const handleSavePerf = async (id: string, data: PerformanceData) => { await api.patch(`/api/posts/${id}/performance`, data); mutatePosted(); };

    const currentPosts = activeTab === 'pending' ? pendingPosts : activeTab === 'approved' ? approvedPosts : postedPosts;
    const isLoading = activeTab === 'pending' ? pendingLoading : activeTab === 'approved' ? approvedLoading : postedLoading;

    if (userLoading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}>

            {/* Sticky header + trial banner */}
            <div className="sticky top-0 z-40">
                <header className="border-b border-slate-200/80"
                    style={{ background: 'rgba(248,250,252,0.90)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)', boxShadow: '0 1px 3px rgba(10,102,194,0.30)' }}>
                                <span className="text-white text-xs font-bold">V</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 tracking-tight">VoicePost</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setGenerateOpen(true)}
                                className="flex items-center gap-1.5 py-1.5 px-3 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(10,102,194,0.18)' }}>
                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                <span className="hidden sm:inline">New post</span>
                            </button>
                            <a href="/settings" className="w-8 h-8 flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150">
                                <Settings className="w-4 h-4" />
                            </a>
                            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white shrink-0">
                                {user?.profileImageUrl ? (
                                    <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)' }}>
                                        <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase() ?? 'U'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
                <TrialBanner />
            </div>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
                <StreakTracker streak={streak} />

                <div className="border-b border-slate-200">
                    <div className="flex gap-6">
                        {([
                            { key: 'pending' as ActiveTab, label: 'To Review', count: pendingPosts.length },
                            { key: 'approved' as ActiveTab, label: 'Approved', count: approvedPosts.length },
                            { key: 'posted' as ActiveTab, label: 'Posted', count: postedPosts.length },
                        ]).map((tab) => (
                            <TabButton key={tab.key} label={tab.label} count={tab.count} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }} className="space-y-4">
                        {isLoading ? (
                            <><PostCardSkeleton /><PostCardSkeleton /></>
                        ) : currentPosts.length === 0 ? (
                            <EmptyState tab={activeTab} onGenerate={() => setGenerateOpen(true)} />
                        ) : (
                            <AnimatePresence>
                                {currentPosts.map((post) => (
                                    <PostCard key={post._id} post={post}
                                        onApprove={handleApprove} onDiscard={handleDiscard} onEdit={handleEdit}
                                        onMarkPosted={handleMarkPosted} onSavePerformance={handleSavePerf}
                                        hidePerformance={false}
                                    />
                                ))}
                            </AnimatePresence>
                        )}

                        {/* Upgrade prompt for performance tracker */}
                        {activeTab === 'posted' && !canUsePerformanceTracker && postedPosts.length > 0 && (
                            <PlanGate requiredPlan="pro" feature="Performance Tracker" />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            <GenerateDialog
                open={generateOpen}
                onClose={() => setGenerateOpen(false)}
                topicBuckets={profile?.topicBuckets ?? []}
                onSuccess={() => { mutatePending(); setActiveTab('pending'); }}
                weeklyLimit={postsPerWeek}
                weekPostCount={weekPostCount}
            />
        </div>
    );
}
