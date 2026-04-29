'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag } from 'lucide-react';

interface TopicManagerProps {
    topics: string[];
    onChange: (topics: string[]) => void;
    maxTopics?: number;
    minTopics?: number;
    suggestions?: string[];
    disabled?: boolean;
}

const DEFAULT_SUGGESTIONS = [
    'Founder lessons',
    'Product building',
    'Startup failures',
    'AI tools',
    'Leadership',
    'Career advice',
    'Industry insights',
    'Remote work',
    'Fundraising',
    'Team building',
];

// Distinct tag colors so the list feels curated, not monochrome
const TAG_PALETTE = [
    { bg: '#EBF3FB', text: '#004182', border: '#70B5F9' },
    { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
    { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
    { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' },
    { bg: '#FFF1F2', text: '#9F1239', border: '#FDA4AF' },
    { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
    { bg: '#F0F9FF', text: '#0C4A6E', border: '#7DD3FC' },
    { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
    { bg: '#FDF4FF', text: '#701A75', border: '#E879F9' },
    { bg: '#FFFBEB', text: '#78350F', border: '#FCD34D' },
];

function getTagColor(index: number) {
    return TAG_PALETTE[index % TAG_PALETTE.length];
}

export default function TopicManager({
    topics,
    onChange,
    maxTopics = 10,
    minTopics = 3,
    suggestions = DEFAULT_SUGGESTIONS,
    disabled = false,
}: TopicManagerProps) {
    const [inputValue, setInputValue] = useState('');
    const [shakeIndex, setShakeIndex] = useState<number | null>(null);
    const [showMinWarning, setShowMinWarning] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isAtMax = topics.length >= maxTopics;
    const availableSuggestions = suggestions.filter(
        (s) => !topics.map((t) => t.toLowerCase()).includes(s.toLowerCase())
    );

    /* ─── Add topic ───────────────────────────────────────────── */
    function addTopic(value: string) {
        const trimmed = value.trim();
        if (!trimmed || trimmed.length < 2) return;
        if (isAtMax) return;
        if (topics.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
            // Already exists — shake the matching tag
            const idx = topics.findIndex(
                (t) => t.toLowerCase() === trimmed.toLowerCase()
            );
            triggerShake(idx);
            return;
        }
        onChange([...topics, trimmed]);
        setInputValue('');
    }

    /* ─── Remove topic ────────────────────────────────────────── */
    function removeTopic(index: number) {
        if (topics.length <= minTopics) {
            triggerShake(index);
            setShowMinWarning(true);
            setTimeout(() => setShowMinWarning(false), 2500);
            return;
        }
        onChange(topics.filter((_, i) => i !== index));
    }

    /* ─── Shake animation trigger ─────────────────────────────── */
    function triggerShake(index: number) {
        setShakeIndex(index);
        setTimeout(() => setShakeIndex(null), 500);
    }

    /* ─── Key handling ────────────────────────────────────────── */
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTopic(inputValue);
        }
        if (e.key === 'Backspace' && !inputValue && topics.length > 0) {
            removeTopic(topics.length - 1);
        }
    }

    return (
        <div className="space-y-3">
            {/* ── Tag input area ──────────────────────────────────── */}
            <div
                onClick={() => inputRef.current?.focus()}
                className={`
          min-h-[52px] flex flex-wrap gap-2 items-center
          bg-white border rounded-[8px] px-3 py-2.5 cursor-text
          transition-shadow duration-150
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${isAtMax ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'}
        `}
                style={{
                    boxShadow: isAtMax
                        ? '0 0 0 3px rgba(251,191,36,0.12)'
                        : 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
            >
                {/* Tags */}
                <AnimatePresence>
                    {topics.map((topic, i) => {
                        const color = getTagColor(i);
                        return (
                            <motion.span
                                key={topic}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={
                                    shakeIndex === i
                                        ? {
                                            opacity: 1,
                                            scale: 1,
                                            x: [0, -4, 4, -3, 3, 0],
                                        }
                                        : { opacity: 1, scale: 1, x: 0 }
                                }
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border select-none"
                                style={{
                                    background: color.bg,
                                    color: color.text,
                                    borderColor: color.border,
                                }}
                            >
                                {topic}
                                {!disabled && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTopic(i);
                                        }}
                                        className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 transition-colors duration-100"
                                        aria-label={`Remove topic: ${topic}`}
                                    >
                                        <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                                    </button>
                                )}
                            </motion.span>
                        );
                    })}
                </AnimatePresence>

                {/* Input */}
                {!isAtMax && !disabled && (
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => inputValue && addTopic(inputValue)}
                        placeholder={topics.length === 0 ? 'Type a topic, press Enter…' : ''}
                        className="flex-1 min-w-[140px] text-sm text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-300"
                    />
                )}

                {/* Max reached indicator */}
                {isAtMax && (
                    <span className="text-xs text-amber-600 font-medium ml-1">
                        Maximum {maxTopics} topics reached
                    </span>
                )}
            </div>

            {/* ── Validation messages ──────────────────────────────── */}
            <AnimatePresence>
                {showMinWarning && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-red-500 font-medium flex items-center gap-1"
                    >
                        <span>⚠</span> Minimum {minTopics} topics required
                    </motion.p>
                )}
            </AnimatePresence>

            {/* ── Counter + hint ───────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {inputValue ? (
                        <span className="text-linkedin font-medium">
                            Press Enter to add &ldquo;{inputValue}&rdquo;
                        </span>
                    ) : (
                        'Type a topic and press Enter, or click a suggestion below'
                    )}
                </p>
                <span
                    className={`text-xs font-semibold tabular-nums ${topics.length < minTopics
                        ? 'text-red-400'
                        : topics.length >= maxTopics
                            ? 'text-amber-500'
                            : 'text-slate-400'
                        }`}
                >
                    {topics.length}/{maxTopics}
                </span>
            </div>

            {/* ── Suggestions ─────────────────────────────────────── */}
            {!disabled && availableSuggestions.length > 0 && !isAtMax && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Suggestions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        <AnimatePresence>
                            {availableSuggestions.map((s) => (
                                <motion.button
                                    key={s}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                    onClick={() => addTopic(s)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 hover:bg-linkedin-light hover:text-linkedin hover:border-linkedin/30 transition-all duration-150 active:scale-[0.96]"
                                >
                                    <Plus className="w-3 h-3" strokeWidth={2.5} />
                                    {s}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}