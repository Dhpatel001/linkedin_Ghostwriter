'use client';

import { motion } from 'framer-motion';

interface StreakTrackerProps {
    streak: number; // consecutive weeks with at least 1 approved post
}

function getStreakConfig(streak: number): {
    emoji: string;
    message: string;
    subtext: string;
    gradient: string;
    glow: string;
    dotColor: string;
} {
    if (streak === 0)
        return {
            emoji: '✦',
            message: 'Start your streak this week',
            subtext: 'Approve your first post to begin',
            gradient: 'from-slate-100 to-slate-50',
            glow: 'transparent',
            dotColor: '#CBD5E1',
        };
    if (streak <= 3)
        return {
            emoji: '🔥',
            message: `Week ${streak} streak — keep going`,
            subtext: 'You\'re building momentum',
            gradient: 'from-orange-50 to-amber-50',
            glow: 'rgba(251,146,60,0.20)',
            dotColor: '#F97316',
        };
    if (streak <= 7)
        return {
            emoji: '🔥',
            message: `${streak}-week streak — you're on a roll`,
            subtext: 'LinkedIn is starting to notice',
            gradient: 'from-orange-50 to-red-50',
            glow: 'rgba(239,68,68,0.20)',
            dotColor: '#EF4444',
        };
    return {
        emoji: '⚡',
        message: `${streak}-week streak — LinkedIn algorithm loves you`,
        subtext: 'Elite consistency. Keep it going.',
        gradient: 'from-linkedin-light to-blue-50',
        glow: 'rgba(10,102,194,0.18)',
        dotColor: '#0A66C2',
    };
}

// Renders up to 8 dot indicators for the last N weeks
function StreakDots({ streak }: { streak: number }) {
    const total = Math.min(Math.max(streak + 2, 5), 8);
    const dots = Array.from({ length: total }, (_, i) => i < streak);

    return (
        <div className="flex items-center gap-1">
            {dots.map((filled, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 20,
                        delay: i * 0.04,
                    }}
                    className="rounded-full"
                    style={{
                        width: 6,
                        height: 6,
                        background: filled ? getStreakConfig(streak).dotColor : '#E2E8F0',
                        boxShadow: filled
                            ? `0 0 0 2px ${getStreakConfig(streak).glow}`
                            : 'none',
                    }}
                />
            ))}
        </div>
    );
}

export default function StreakTracker({ streak }: StreakTrackerProps) {
    const config = getStreakConfig(streak);

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={`w-full bg-gradient-to-r ${config.gradient} border border-slate-200/80 rounded-[10px] px-4 py-2.5`}
            style={{
                boxShadow:
                    streak > 0
                        ? `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${config.glow}`
                        : '0 1px 3px rgba(0,0,0,0.04)',
            }}
        >
            <div className="flex items-center justify-between">
                {/* Left: emoji + message */}
                <div className="flex items-center gap-2.5">
                    {streak > 0 ? (
                        <motion.span
                            className="text-lg select-none"
                            animate={
                                streak > 0
                                    ? {
                                        rotate: [-2, 2, -2],
                                        scale: [1, 1.1, 1],
                                    }
                                    : {}
                            }
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            {config.emoji}
                        </motion.span>
                    ) : (
                        <span className="text-base text-slate-400 select-none">
                            {config.emoji}
                        </span>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                            {config.message}
                        </span>
                        <span className="hidden sm:inline text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{config.subtext}</span>
                    </div>
                </div>

                {/* Right: dot indicators */}
                <div className="flex items-center gap-2">
                    <StreakDots streak={streak} />
                    {streak > 0 && (
                        <span className="text-xs font-bold tabular-nums text-slate-500 ml-1">
                            {streak}w
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}