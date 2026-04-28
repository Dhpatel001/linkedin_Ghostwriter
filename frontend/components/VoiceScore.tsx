'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface VoiceScoreProps {
  postId: string;
  onSubmit: (score: number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SCORE_LABELS: Record<string, string> = {
  '1': 'Too generic',
  '2': 'Too generic',
  '3': 'Too generic',
  '4': 'Close but not quite',
  '5': 'Close but not quite',
  '6': 'Close but not quite',
  '7': 'Pretty accurate',
  '8': 'Pretty accurate',
  '9': "That's exactly me",
  '10': "That's exactly me",
};

function getScoreColor(score: number): {
  track: string;
  thumb: string;
  label: string;
  bg: string;
  border: string;
} {
  if (score <= 4)
    return {
      track: '#FCA5A5',
      thumb: '#EF4444',
      label: '#991B1B',
      bg: '#FEF2F2',
      border: '#FCA5A5',
    };
  if (score <= 7)
    return {
      track: '#FCD34D',
      thumb: '#F59E0B',
      label: '#92400E',
      bg: '#FFFBEB',
      border: '#FCD34D',
    };
  return {
    track: '#86EFAC',
    thumb: '#22C55E',
    label: '#166534',
    bg: '#F0FDF4',
    border: '#86EFAC',
  };
}

export default function VoiceScore({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VoiceScoreProps) {
  const [score, setScore] = useState(7);
  const colors = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
      className="mt-4 rounded-[10px] border p-4 transition-colors duration-300"
    >
      {/* Header */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        How much does this sound like you?
      </p>

      {/* Score display */}
      <div className="flex items-center justify-between mb-3">
        <motion.span
          key={score}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="text-2xl font-bold tabular-nums"
          style={{ color: colors.thumb }}
        >
          {score}
          <span className="text-sm font-normal text-slate-400">/10</span>
        </motion.span>

        <motion.span
          key={SCORE_LABELS[String(score)]}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium"
          style={{ color: colors.label }}
        >
          {SCORE_LABELS[String(score)]}
        </motion.span>
      </div>

      {/* Slider */}
      <div className="relative mb-4">
        {/* Track background */}
        <div className="h-2 rounded-full bg-slate-200 relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ background: colors.track }}
            animate={{ width: `${((score - 1) / 9) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Native range input (invisible, on top for interaction) */}
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
          aria-label="Voice score rating"
        />

        {/* Tick marks */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {[1, 5, 10].map((tick) => (
            <span key={tick} className="text-[10px] text-slate-400 font-medium">
              {tick}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(score)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-[6px] text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: isSubmitting ? '#94A3B8' : colors.thumb,
            boxShadow: isSubmitting
              ? 'none'
              : `0 1px 3px rgba(0,0,0,0.12), 0 2px 8px ${colors.thumb}40`,
          }}
        >
          {isSubmitting ? (
            <span className="animate-pulse">Approving…</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              Confirm approval
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="py-2 px-3 rounded-[6px] text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
