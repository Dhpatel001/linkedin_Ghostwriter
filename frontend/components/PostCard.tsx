'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    Pencil,
    X,
    Copy,
    ExternalLink,
    BookmarkCheck,
    ChevronDown,
    ChevronUp,
    Eye,
    Heart,
    MessageCircle,
    Save,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import VoiceScore from '@/components/VoiceScore';
import { Post } from '@/hooks/usePosts';
import { copyToClipboard, getLinkedInShareUrl } from '@/lib/linkedin';

/* ─── Types ─────────────────────────────────────────────────── */
interface PerformanceData {
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
}

interface PostCardProps {
    post: Post;
    onApprove: (id: string, voiceScore: number) => Promise<void>;
    onDiscard: (id: string) => Promise<void>;
    onEdit: (id: string, content: string) => Promise<void>;
    onMarkPosted: (id: string) => Promise<void>;
    onSavePerformance: (id: string, data: PerformanceData) => Promise<void>;
    hidePerformance?: boolean; // true for Starter plan — performance tracker gated
}

type InternalState = 'default' | 'scoring' | 'editing' | 'discard-confirm';

/* ─── Helpers ───────────────────────────────────────────────── */
function getStatusStyle(status: Post['status']) {
    switch (status) {
        case 'approved':
            return {
                border: '3px solid #86EFAC',
                accent: '#22C55E',
                bg: 'rgba(240,253,244,0.6)',
            };
        case 'posted':
            return {
                border: '3px solid #70B5F9',
                accent: '#0A66C2',
                bg: 'rgba(235,243,251,0.6)',
            };
        default:
            return {
                border: '3px solid transparent',
                accent: '#F59E0B',
                bg: 'rgba(255,255,255,0.85)',
            };
    }
}

function TopicBadge({ topic }: { topic: string }) {
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-linkedin-light text-linkedin-hover border border-linkedin/20">
            {topic}
        </span>
    );
}

function TimeAgo({ date }: { date: string }) {
    return (
        <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </span>
    );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function PostCard({
    post,
    onApprove,
    onDiscard,
    onEdit,
    onMarkPosted,
    onSavePerformance,
    hidePerformance = false,
}: PostCardProps) {
    const [internalState, setInternalState] = useState<InternalState>('default');
    const [isExpanded, setIsExpanded] = useState(false);
    const [editContent, setEditContent] = useState(post.editedContent ?? post.content);
    const [isBusy, setIsBusy] = useState(false);
    const [performance, setPerformance] = useState<PerformanceData>(
        post.performance ?? {}
    );
    const [perfSaved, setPerfSaved] = useState(false);
    const editRef = useRef<HTMLTextAreaElement>(null);

    const displayContent = post.editedContent ?? post.content;
    const isLong = displayContent.length > 300;
    const preview = isLong && !isExpanded ? displayContent.slice(0, 280) + '…' : displayContent;
    const statusStyle = getStatusStyle(post.status);

    /* ─── Handlers ─────────────────────────────────────────────── */
    const handleApprove = async (score: number) => {
        setIsBusy(true);
        try {
            await onApprove(post._id, score);
            toast.success('Post approved! 🎉', { description: 'Moved to your approved queue.' });
            setInternalState('default');
        } catch {
            toast.error('Could not approve. Try again.');
        } finally {
            setIsBusy(false);
        }
    };

    const handleDiscard = async () => {
        setIsBusy(true);
        try {
            await onDiscard(post._id);
            toast.success('Post discarded.');
        } catch {
            toast.error('Could not discard. Try again.');
        } finally {
            setIsBusy(false);
            setInternalState('default');
        }
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim()) {
            toast.error('Post content cannot be empty.');
            return;
        }
        setIsBusy(true);
        try {
            await onEdit(post._id, editContent.trim());
            toast.success('Edit saved.');
            setInternalState('default');
        } catch {
            toast.error('Could not save edit. Try again.');
        } finally {
            setIsBusy(false);
        }
    };

    const handleCopy = async () => {
        const ok = await copyToClipboard(displayContent);
        if (ok) {
            toast.success('Copied to clipboard!');
        } else {
            toast.error('Could not copy. Please copy manually.');
        }
    };

    const handleLinkedIn = () => {
        window.open(getLinkedInShareUrl(displayContent), '_blank', 'noopener,noreferrer');
    };

    const handleMarkPosted = async () => {
        setIsBusy(true);
        try {
            await onMarkPosted(post._id);
            toast.success('Marked as posted! 🚀');
        } catch {
            toast.error('Could not update status. Try again.');
        } finally {
            setIsBusy(false);
        }
    };

    const handleSavePerformance = async () => {
        setIsBusy(true);
        try {
            await onSavePerformance(post._id, performance);
            setPerfSaved(true);
            toast.success('Performance data saved.');
            setTimeout(() => setPerfSaved(false), 3000);
        } catch {
            toast.error('Could not save performance data.');
        } finally {
            setIsBusy(false);
        }
    };

    /* ─── Render ────────────────────────────────────────────────── */
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
                borderLeft: statusStyle.border,
                background: statusStyle.bg,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
            }}
            className="rounded-[12px] border border-slate-200/80 p-5 transition-shadow duration-200 hover:shadow-card-hover relative overflow-hidden"
        >
            {/* ── Top row: topic + date ─────────────────────────────── */}
            <div className="flex items-center justify-between mb-3">
                <TopicBadge topic={post.topic} />
                <TimeAgo date={post.generatedAt} />
            </div>

            {/* ── Hook line ─────────────────────────────────────────── */}
            {internalState !== 'editing' && (
                <p className="font-semibold text-[15px] text-slate-900 leading-snug mb-2 line-clamp-2">
                    {post.hook || displayContent.split('\n')[0]}
                </p>
            )}

            {/* ── Content area ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {internalState === 'editing' ? (
                    /* Edit mode */
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <textarea
                            ref={editRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={8}
                            autoFocus
                            className="w-full text-sm text-slate-700 leading-relaxed bg-white border border-slate-300 rounded-[8px] p-3 resize-y focus:outline-none transition-shadow duration-150"
                            style={{
                                boxShadow: '0 0 0 3px rgba(10,102,194,0.12), 0 1px 2px rgba(0,0,0,0.05)',
                            }}
                            placeholder="Edit your post content here…"
                        />
                        <p className="text-xs text-slate-400 mt-1 text-right">
                            {editContent.length} chars
                        </p>
                    </motion.div>
                ) : (
                    /* Read mode */
                    <motion.div key="content" layout>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {preview}
                        </p>
                        {isLong && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-1 mt-1.5 text-xs font-medium text-linkedin hover:text-linkedin-hover transition-colors duration-150"
                            >
                                {isExpanded ? (
                                    <><ChevronUp className="w-3 h-3" />Show less</>
                                ) : (
                                    <><ChevronDown className="w-3 h-3" />Show more</>
                                )}
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Voice score (slides in after Approve click) ─────── */}
            <AnimatePresence>
                {internalState === 'scoring' && (
                    <VoiceScore
                        postId={post._id}
                        onSubmit={handleApprove}
                        onCancel={() => setInternalState('default')}
                        isSubmitting={isBusy}
                    />
                )}
            </AnimatePresence>

            {/* ── Discard confirmation ───────────────────────────────── */}
            <AnimatePresence>
                {internalState === 'discard-confirm' && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="mt-4 p-3.5 rounded-[8px] bg-red-50 border border-red-100"
                    >
                        <p className="text-sm font-medium text-red-800 mb-3">
                            Remove this post? This can&apos;t be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDiscard}
                                disabled={isBusy}
                                className="flex-1 py-1.5 px-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
                            >
                                {isBusy ? 'Discarding…' : 'Yes, remove it'}
                            </button>
                            <button
                                onClick={() => setInternalState('default')}
                                disabled={isBusy}
                                className="py-1.5 px-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                            >
                                Keep it
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Action bar ──────────────────────────────────────────── */}
            <AnimatePresence mode="wait">

                {/* PENDING actions */}
                {post.status === 'pending' && internalState !== 'scoring' && internalState !== 'discard-confirm' && (
                    <motion.div
                        key="pending-actions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 mt-4 flex-wrap"
                    >
                        {internalState === 'editing' ? (
                            /* Edit mode actions */
                            <>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isBusy}
                                    className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
                                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 2px 6px rgba(10,102,194,0.20)' }}
                                >
                                    {isBusy ? (
                                        <span className="animate-pulse">Saving…</span>
                                    ) : (
                                        <><Save className="w-3.5 h-3.5" />Save edit</>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditContent(post.editedContent ?? post.content);
                                        setInternalState('default');
                                    }}
                                    disabled={isBusy}
                                    className="flex items-center gap-1.5 py-2 px-3 text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />Cancel
                                </button>
                            </>
                        ) : (
                            /* Default pending actions */
                            <>
                                <button
                                    onClick={() => setInternalState('scoring')}
                                    className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 2px 6px rgba(10,102,194,0.20)' }}
                                >
                                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => {
                                        setInternalState('editing');
                                        setTimeout(() => editRef.current?.focus(), 50);
                                    }}
                                    className="flex items-center gap-1.5 py-2 px-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setInternalState('discard-confirm')}
                                    className="flex items-center gap-1.5 py-2 px-3 text-sm font-medium text-red-500 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 rounded-[6px] transition-all duration-150 active:scale-[0.97] ml-auto"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Discard
                                </button>
                            </>
                        )}
                    </motion.div>
                )}

                {/* APPROVED actions */}
                {post.status === 'approved' && (
                    <motion.div
                        key="approved-actions"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="flex items-center gap-2 mt-4 flex-wrap"
                    >
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 py-2 px-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copy text
                        </button>
                        <button
                            onClick={handleLinkedIn}
                            className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]"
                            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 2px 6px rgba(10,102,194,0.20)' }}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Post to LinkedIn
                        </button>
                        <button
                            onClick={handleMarkPosted}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 py-2 px-3 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60 ml-auto"
                        >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            {isBusy ? 'Saving…' : 'Mark as posted'}
                        </button>
                    </motion.div>
                )}

                {/* POSTED actions — performance tracker */}
                {post.status === 'posted' && !hidePerformance && (
                    <motion.div
                        key="posted-actions"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="mt-4"
                    >
                        {/* If performance already saved — show badges */}
                        {perfSaved ||
                            (post.performance?.impressions != null ||
                                post.performance?.likes != null ||
                                post.performance?.comments != null) ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                {(performance.impressions ?? post.performance?.impressions) != null && (
                                    <PerformanceBadge
                                        icon={<Eye className="w-3 h-3" />}
                                        value={performance.impressions ?? post.performance?.impressions ?? 0}
                                        label="impressions"
                                        color="blue"
                                    />
                                )}
                                {(performance.likes ?? post.performance?.likes) != null && (
                                    <PerformanceBadge
                                        icon={<Heart className="w-3 h-3" />}
                                        value={performance.likes ?? post.performance?.likes ?? 0}
                                        label="likes"
                                        color="pink"
                                    />
                                )}
                                {(performance.comments ?? post.performance?.comments) != null && (
                                    <PerformanceBadge
                                        icon={<MessageCircle className="w-3 h-3" />}
                                        value={performance.comments ?? post.performance?.comments ?? 0}
                                        label="comments"
                                        color="violet"
                                    />
                                )}
                                <button
                                    onClick={() => setPerfSaved(false)}
                                    className="text-xs text-slate-400 hover:text-slate-600 ml-auto underline underline-offset-2 transition-colors"
                                >
                                    Edit
                                </button>
                            </div>
                        ) : (
                            /* Performance input row */
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                    Track performance
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <PerformanceInput
                                        icon={<Eye className="w-3.5 h-3.5 text-blue-400" />}
                                        placeholder="Impressions"
                                        value={performance.impressions ?? ''}
                                        onChange={(v) => setPerformance((p) => ({ ...p, impressions: v }))}
                                    />
                                    <PerformanceInput
                                        icon={<Heart className="w-3.5 h-3.5 text-pink-400" />}
                                        placeholder="Likes"
                                        value={performance.likes ?? ''}
                                        onChange={(v) => setPerformance((p) => ({ ...p, likes: v }))}
                                    />
                                    <PerformanceInput
                                        icon={<MessageCircle className="w-3.5 h-3.5 text-violet-400" />}
                                        placeholder="Comments"
                                        value={performance.comments ?? ''}
                                        onChange={(v) => setPerformance((p) => ({ ...p, comments: v }))}
                                    />
                                    <button
                                        onClick={handleSavePerformance}
                                        disabled={isBusy}
                                        className="flex items-center gap-1.5 py-1.5 px-3 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60 whitespace-nowrap"
                                        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 2px 4px rgba(10,102,194,0.15)' }}
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {isBusy ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>
        </motion.div>
    );
}

/* ─── Sub-components ────────────────────────────────────────── */
function PerformanceInput({
    icon,
    placeholder,
    value,
    onChange,
}: {
    icon: React.ReactNode;
    placeholder: string;
    value: number | string;
    onChange: (v: number) => void;
}) {
    return (
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-[6px] px-2 py-1.5 focus-within:border-linkedin/40 transition-colors duration-150 w-32">
            {icon}
            <input
                type="number"
                min={0}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full text-sm text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
        </div>
    );
}

function PerformanceBadge({
    icon,
    value,
    label,
    color,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    color: 'blue' | 'pink' | 'violet';
}) {
    const styles = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        pink: 'bg-pink-50 text-pink-700 border-pink-100',
        violet: 'bg-violet-50 text-violet-700 border-violet-100',
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[color]}`}
        >
            {icon}
            {value.toLocaleString()}
            <span className="font-normal opacity-70">{label}</span>
        </span>
    );
}
