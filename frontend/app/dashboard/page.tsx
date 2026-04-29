'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Sparkles,
    LogOut,
    Settings,
    ChevronDown,
    Calendar,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PostCard from '@/components/PostCard';
import StreakTracker from '@/components/StreakTracker';
import { usePosts, Post, PostStatus } from '@/hooks/usePosts';
import { useVoiceProfile } from '@/hooks/useVoiceProfile';
import api from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────── */
type ActiveTab = 'pending' | 'approved' | 'posted';

interface PerformanceData {
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
}

/* ─── Next Monday helper ─────────────────────────────────────── */
function getNextMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 1 ? 7 : (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });
}

/* ─── Empty state component ─────────────────────────────────── */
function EmptyState({
    tab,
    onGenerate,
}: {
    tab: ActiveTab;
    onGenerate?: () => void;
}) {
    const configs = {
        pending: {
            icon: '📅',
            title: 'You\'re all caught up',
            body: `Your posts generate every Monday at 7:30am. Next batch: ${getNextMonday()}.`,
            cta: 'Generate one now',
            showCta: true,
        },
        approved: {
            icon: '✅',
            title: 'No approved posts yet',
            body: 'Go to the Review tab and approve the posts that sound like you.',
            cta: null,
            showCta: false,
        },
        posted: {
            icon: '📊',
            title: 'Nothing posted yet',
            body: 'Posts you mark as published appear here. Track what performs.',
            cta: null,
            showCta: false,
        },
    };

    const c = configs[tab];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
                className="text-5xl mb-4 select-none"
            >
                {c.icon}
            </motion.div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">{c.title}</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-4">{c.body}</p>
            {c.showCta && onGenerate && (
                <button
                    onClick={onGenerate}
                    className="flex items-center gap-2 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 2px 6px rgba(10,102,194,0.20)' }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    {c.cta}
                </button>
            )}
        </motion.div>
    );
}

/* ─── Skeleton loader ────────────────────────────────────────── */
function PostCardSkeleton() {
    return (
        <div className="rounded-[12px] border border-slate-200 bg-white/80 p-5 space-y-3">
            <div className="flex justify-between">
                <div className="skeleton h-5 w-24 rounded-full" />
                <div className="skeleton h-4 w-16" />
            </div>
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
            <div className="flex gap-2 mt-2">
                <div className="skeleton h-8 w-24 rounded-[6px]" />
                <div className="skeleton h-8 w-16 rounded-[6px]" />
                <div className="skeleton h-8 w-16 rounded-[6px] ml-auto" />
            </div>
        </div>
    );
}

/* ─── Generate dialog ────────────────────────────────────────── */
function GenerateDialog({
    open,
    onClose,
    topicBuckets,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    topicBuckets: string[];
    onSuccess: () => void;
}) {
    const [selected, setSelected] = useState('');
    const [custom, setCustom] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const topic = custom.trim() || selected;

    async function handleGenerate() {
        if (!topic) {
            toast.error('Pick a topic or type a custom one.');
            return;
        }
        setIsGenerating(true);
        try {
            await api.post('/api/posts/generate', { topic });
            toast.success('Post generated!', {
                description: 'Check the Review tab — it\'s ready for you.',
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Generation failed. Try again.');
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md rounded-[14px] border border-slate-200 bg-white p-0 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Sparkles className="w-4 h-4 text-linkedin" />
                            Generate a post now
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 mt-1">
                        Pick a topic from your list or type something new.
                    </p>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Topic pills */}
                    {topicBuckets.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                Your topics
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {topicBuckets.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setSelected(t);
                                            setCustom('');
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.96] ${selected === t && !custom
                                            ? 'bg-linkedin text-white border-linkedin shadow-btn'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-linkedin/40 hover:bg-linkedin-light hover:text-linkedin'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom topic */}
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Or type a one-off topic
                        </p>
                        <input
                            value={custom}
                            onChange={(e) => {
                                setCustom(e.target.value);
                                if (e.target.value) setSelected('');
                            }}
                            placeholder="e.g. My biggest product launch mistake"
                            className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-[8px] px-3 py-2.5 focus:outline-none transition-shadow duration-150 placeholder:text-slate-300"
                            style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                            onFocus={(e) =>
                            (e.target.style.boxShadow =
                                '0 0 0 3px rgba(10,102,194,0.12), inset 0 1px 2px rgba(0,0,0,0.04)')
                            }
                            onBlur={(e) =>
                                (e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)')
                            }
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={!topic || isGenerating}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                        style={
                            topic && !isGenerating
                                ? { boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 2px 8px rgba(10,102,194,0.22)' }
                                : {}
                        }
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Generate post
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="py-2.5 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Tab button ─────────────────────────────────────────────── */
function TabButton({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center gap-2 py-2.5 px-1 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none ${active ? 'text-linkedin' : 'text-slate-500 hover:text-slate-800'
                }`}
        >
            {label}
            {count > 0 && (
                <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${active
                        ? 'bg-linkedin text-white'
                        : 'bg-slate-100 text-slate-500'
                        }`}
                >
                    {count}
                </span>
            )}
            {/* Active underline */}
            {active && (
                <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-linkedin rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
            )}
        </button>
    );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
    const [generateOpen, setGenerateOpen] = useState(false);

    const {
        posts: pendingPosts,
        isLoading: pendingLoading,
        mutate: mutatePending,
    } = usePosts('pending');

    const {
        posts: approvedPosts,
        isLoading: approvedLoading,
        mutate: mutateApproved,
    } = usePosts('approved');

    const {
        posts: postedPosts,
        isLoading: postedLoading,
        mutate: mutatePosted,
    } = usePosts('posted');

    const { profile } = useVoiceProfile();

    // Derive streak from postedPosts (simplified — backend should return this)
    // For now calculate consecutive weeks
    const streak = postedPosts.length; // TODO: replace with real streak from API

    const tabConfig = [
        { key: 'pending' as ActiveTab, label: 'To Review', count: pendingPosts.length },
        { key: 'approved' as ActiveTab, label: 'Approved', count: approvedPosts.length },
        { key: 'posted' as ActiveTab, label: 'Posted', count: postedPosts.length },
    ];

    /* ─── Post action handlers ─────────────────────────────── */
    const handleApprove = async (id: string, voiceScore: number) => {
        // Optimistic update
        mutatePending(
            (current) =>
                current?.filter((p) => p._id !== id),
            false
        );
        await api.patch(`/api/posts/${id}/approve`, { voiceScore });
        mutatePending();
        mutateApproved();
    };

    const handleDiscard = async (id: string) => {
        mutatePending(
            (current) => current?.filter((p) => p._id !== id),
            false
        );
        await api.patch(`/api/posts/${id}/discard`);
        mutatePending();
    };

    const handleEdit = async (id: string, content: string) => {
        await api.patch(`/api/posts/${id}/edit`, { editedContent: content });
        mutatePending();
        mutateApproved();
    };

    const handleMarkPosted = async (id: string) => {
        mutateApproved(
            (current) => current?.filter((p) => p._id !== id),
            false
        );
        await api.patch(`/api/posts/${id}/posted`);
        mutateApproved();
        mutatePosted();
    };

    const handleSavePerformance = async (
        id: string,
        data: PerformanceData
    ) => {
        await api.patch(`/api/posts/${id}/performance`, data);
        mutatePosted();
    };

    /* ─── Current tab posts + state ─────────────────────────── */
    const currentPosts =
        activeTab === 'pending'
            ? pendingPosts
            : activeTab === 'approved'
                ? approvedPosts
                : postedPosts;

    const isLoading =
        activeTab === 'pending'
            ? pendingLoading
            : activeTab === 'approved'
                ? approvedLoading
                : postedLoading;

    /* ─── Render ─────────────────────────────────────────────── */
    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}
        >
            {/* ── Header ────────────────────────────────────────────── */}
            <header
                className="sticky top-0 z-40 border-b border-slate-200/80"
                style={{
                    background: 'rgba(248,250,252,0.90)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}
            >
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-[6px] flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
                                boxShadow: '0 1px 3px rgba(10,102,194,0.30)',
                            }}
                        >
                            <span className="text-white text-xs font-bold">V</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tight">
                            VoicePost
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setGenerateOpen(true)}
                            className="flex items-center gap-1.5 py-1.5 px-3 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(10,102,194,0.18)' }}
                        >
                            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span className="hidden sm:inline">New post</span>
                        </button>

                        <a
                            href="/settings"
                            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
                        >
                            <Settings className="w-4 h-4" />
                        </a>

                        <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white">
                            {/* Avatar placeholder — replace with real user data */}
                            <div className="w-full h-full bg-gradient-to-br from-linkedin to-linkedin-hover flex items-center justify-center">
                                <span className="text-white text-xs font-bold">U</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Page body ─────────────────────────────────────────── */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Streak tracker */}
                <StreakTracker streak={streak} />

                {/* Tabs */}
                <div className="border-b border-slate-200">
                    <div className="flex gap-6">
                        {tabConfig.map((tab) => (
                            <TabButton
                                key={tab.key}
                                label={tab.label}
                                count={tab.count}
                                active={activeTab === tab.key}
                                onClick={() => setActiveTab(tab.key)}
                            />
                        ))}
                    </div>
                </div>

                {/* Post list */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="space-y-4"
                    >
                        {isLoading ? (
                            /* Skeleton */
                            <>
                                <PostCardSkeleton />
                                <PostCardSkeleton />
                                <PostCardSkeleton />
                            </>
                        ) : currentPosts.length === 0 ? (
                            <EmptyState
                                tab={activeTab}
                                onGenerate={() => setGenerateOpen(true)}
                            />
                        ) : (
                            <AnimatePresence>
                                {currentPosts.map((post) => (
                                    <PostCard
                                        key={post._id}
                                        post={post}
                                        onApprove={handleApprove}
                                        onDiscard={handleDiscard}
                                        onEdit={handleEdit}
                                        onMarkPosted={handleMarkPosted}
                                        onSavePerformance={handleSavePerformance}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ── Generate dialog ───────────────────────────────────── */}
            <GenerateDialog
                open={generateOpen}
                onClose={() => setGenerateOpen(false)}
                topicBuckets={profile?.topicBuckets ?? []}
                onSuccess={() => {
                    mutatePending();
                    setActiveTab('pending');
                }}
            />
        </div>
    );
}