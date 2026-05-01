'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mic2,
  SlidersHorizontal,
  User as UserIcon,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  Check,
  Loader2,
  LogOut,
  Unlink,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TopicManager from '@/components/TopicManager';
import TrialBanner from '@/components/TrialBanner';
import { useVoiceProfile } from '@/hooks/useVoiceProfile';
import { useUser, type User as AppUser } from '@/hooks/useUser';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import useSWR from 'swr';

/* ─── Types ─────────────────────────────────────────────────── */
type UserData = AppUser;

interface BillingStatus {
  status: string;
  tier: string | null;
  trialEndsAt?: string;
  nextRenewalAt?: string;
  portalUrl?: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data.data);

/* ─── Shared UI atoms ────────────────────────────────────────── */
function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-[14px] border border-slate-200/80 overflow-hidden ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)' }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100">
      <div
        className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #EBF3FB 0%, #F0F9FF 100%)', border: '1px solid rgba(10,102,194,0.12)' }}
      >
        <span className="text-linkedin">{icon}</span>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function SaveButton({
  onClick,
  isSaving,
  saved,
  disabled,
}: {
  onClick: () => void;
  isSaving: boolean;
  saved: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isSaving || disabled}
      className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(10,102,194,0.18)' }}
    >
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
          </motion.span>
        ) : saved ? (
          <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Saved
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Save changes
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-linkedin' : 'bg-slate-200'
      }`}
      style={checked ? { boxShadow: '0 0 0 2px rgba(10,102,194,0.18)' } : {}}
    >
      <motion.span
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

/* ─── Segmented control ──────────────────────────────────────── */
function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { label: string; value: number; locked?: boolean }[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-[8px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => !opt.locked && onChange(opt.value)}
          className={`relative flex-1 py-1.5 px-3 text-sm font-medium rounded-[6px] transition-all duration-150 ${
            value === opt.value
              ? 'text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          } ${opt.locked ? 'cursor-not-allowed' : ''}`}
          style={value === opt.value ? { background: '#0A66C2' } : {}}
        >
          {opt.locked && value !== opt.value && (
            <span className="absolute -top-1 -right-1 text-[9px] bg-amber-400 text-white px-1 rounded-full font-bold">
              PRO
            </span>
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── SECTION 1: Voice Profile ───────────────────────────────── */
function VoiceProfileSection() {
  const { profile, isLoading, mutate } = useVoiceProfile();
  const [topics, setTopics] = useState<string[]>([]);
  const [toneTags, setToneTags] = useState<string[]>([]);
  const [toneInput, setToneInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadTextPosts, setUploadTextPosts] = useState<string[]>([]);
  const [uploadImages, setUploadImages] = useState<{ mediaType: string; data: string }[]>([]);

  useEffect(() => {
    if (profile?.topicBuckets) setTopics(profile.topicBuckets);
    if (profile?.toneTags) setToneTags(profile.toneTags);
  }, [profile]);

  const handleSaveVoiceSettings = async () => {
    setIsSaving(true);
    try {
      await api.post('/api/voice/profile', { topicBuckets: topics, toneTags });
      mutate();
      setSaved(true);
      toast.success('Voice profile updated.');
      setTimeout(() => setSaved(false), 2500);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not save voice profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      await api.patch('/api/voice/regenerate');
      mutate();
      toast.success('Voice profile regenerated!');
      setReanalyzeOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Regeneration failed.'));
    } finally {
      setIsReanalyzing(false);
    }
  };

  const addToneTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    const next = Array.from(new Set([...toneTags, tag])).slice(0, 6);
    setToneTags(next);
    setToneInput('');
  };

  const removeToneTag = (tag: string) => {
    setToneTags((t) => t.filter((x) => x !== tag));
  };

  async function readFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadBusy(true);
    try {
      const textPosts: string[] = [];
      const images: { mediaType: string; data: string }[] = [];

      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result || ''));
            r.onerror = () => reject(new Error('read failed'));
            r.readAsDataURL(file);
          });
          const base64 = dataUrl.split(',')[1] || '';
          if (base64) images.push({ mediaType: file.type, data: base64 });
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = await file.text();
          const chunks = text
            .split(/\n{2,}---+\n{2,}|\n{3,}/g)
            .map((p) => p.trim())
            .filter((p) => p.length >= 20);
          textPosts.push(...chunks);
        }
      }

      setUploadTextPosts((prev) => Array.from(new Set([...prev, ...textPosts])).slice(0, 50));
      setUploadImages((prev) => [...prev, ...images].slice(0, 8));
    } finally {
      setUploadBusy(false);
    }
  }

  async function runUploadAnalysis() {
    setUploadBusy(true);
    try {
      const res = await api.post('/api/voice/analyze-artifacts', {
        samplePosts: uploadTextPosts,
        topics,
        images: uploadImages,
      });
      mutate();
      const updated = res.data?.data;
      if (updated?.toneTags) setToneTags(updated.toneTags);
      if (updated?.topicBuckets) setTopics(updated.topicBuckets);
      toast.success('Voice profile enhanced from uploads.');
      setUploadOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Analysis failed. Try uploading text posts, or configure ANTHROPIC_API_KEY for screenshots.'));
    } finally {
      setUploadBusy(false);
    }
  }

  const TONE_PALETTE = [
    { bg: '#EBF3FB', text: '#004182', border: '#70B5F9' },
    { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
    { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
    { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
    { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE' },
    { bg: '#FFF1F2', text: '#9F1239', border: '#FDA4AF' },
  ];

  return (
    <SectionCard>
      <SectionHeader
        icon={<Mic2 className="w-4 h-4" />}
        title="Voice Profile"
        subtitle="How the AI understands your writing style"
      />

      <div className="p-5 space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        ) : profile ? (
          <>
            {/* Voice description */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Your voice
              </p>
              <div
                className="p-3.5 rounded-[10px] border"
                style={{
                  background: 'linear-gradient(135deg, #EBF3FB 0%, #F0F9FF 100%)',
                  borderColor: 'rgba(10,102,194,0.12)',
                }}
              >
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  &ldquo;{profile.voiceDescription}&rdquo;
                </p>
              </div>
            </div>

            {/* Tone tags */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Tone
              </p>
              <div className="flex flex-wrap gap-1.5">
                {toneTags.map((tag, i) => {
                  const c = TONE_PALETTE[i % TONE_PALETTE.length];
                  return (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5"
                      style={{ background: c.bg, color: c.text, borderColor: c.border }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeToneTag(tag)}
                        className="text-[10px] font-bold opacity-70 hover:opacity-100"
                        aria-label={`Remove tone ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={toneInput}
                  onChange={(e) => setToneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToneTag(toneInput);
                    }
                  }}
                  placeholder="Add tone tag (e.g. concise, friendly)"
                  className="flex-1 text-sm text-slate-700 bg-white border border-slate-200 rounded-[8px] px-3 py-2 focus:outline-none"
                />
                <button
                  onClick={() => addToneTag(toneInput)}
                  className="py-2 px-4 text-sm font-semibold text-linkedin border border-linkedin/20 bg-linkedin-light rounded-[8px]"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Stats row */}
            {(profile.avgVoiceScore != null || profile.totalPostsRated > 0) && (
              <div className="flex items-center gap-4 text-xs text-slate-500 py-2 border-y border-slate-100">
                <span>
                  <span className="font-semibold text-slate-700">{profile.totalPostsRated}</span>{' '}
                  posts rated
                </span>
                {profile.avgVoiceScore != null && (
                  <span>
                    Average voice score:{' '}
                    <span className="font-semibold text-slate-700">
                      {profile.avgVoiceScore.toFixed(1)}/10
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Topics */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Your topics
              </p>
              <TopicManager
                topics={topics}
                onChange={setTopics}
                minTopics={3}
                maxTopics={10}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setReanalyzeOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-150"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-analyze with my posts
              </button>
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-linkedin hover:text-linkedin-hover transition-colors duration-150"
              >
                Upload samples
              </button>
              <SaveButton
                onClick={handleSaveVoiceSettings}
                isSaving={isSaving}
                saved={saved}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500">
              No voice profile yet.{' '}
              <a href="/onboarding" className="text-linkedin hover:underline font-medium">
                Complete onboarding
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Re-analyze confirm dialog */}
      <Dialog open={reanalyzeOpen} onOpenChange={setReanalyzeOpen}>
        <DialogContent className="sm:max-w-sm rounded-[14px] border border-slate-200 bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Re-analyze your voice?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            This will rebuild your voice profile from your original sample posts.
            Your current profile will be overwritten.
          </p>
          <div className="flex gap-2 mt-5">
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97] disabled:opacity-60"
            >
              {isReanalyzing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating…</>
              ) : (
                <><RefreshCw className="w-3.5 h-3.5" /> Yes, rebuild it</>
              )}
            </button>
            <button
              onClick={() => setReanalyzeOpen(false)}
              className="py-2 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[6px] transition-all duration-150"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload samples dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md rounded-[14px] border border-slate-200 bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Upload LinkedIn samples
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Upload <span className="font-semibold">.txt</span> posts or <span className="font-semibold">screenshots</span>.
            Screenshots require <span className="font-semibold">ANTHROPIC_API_KEY</span>.
          </p>

          <div className="mt-4 space-y-3">
            <input
              type="file"
              multiple
              accept=".txt,image/png,image/jpeg,image/webp"
              onChange={(e) => void readFiles(e.target.files)}
              disabled={uploadBusy}
              className="text-sm"
            />

            <div className="text-xs text-slate-500">
              Added: <span className="font-semibold text-slate-700">{uploadTextPosts.length}</span> text posts,{' '}
              <span className="font-semibold text-slate-700">{uploadImages.length}</span> screenshots
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={runUploadAnalysis}
              disabled={uploadBusy || (uploadTextPosts.length === 0 && uploadImages.length === 0)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] disabled:opacity-60"
            >
              {uploadBusy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</> : 'Analyze'}
            </button>
            <button
              onClick={() => setUploadOpen(false)}
              disabled={uploadBusy}
              className="py-2 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[8px]"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

/* ─── SECTION 2: Post Preferences ────────────────────────────── */
function PostPreferencesSection({ user, onSaved }: { user: UserData; onSaved: () => void }) {
  const [postsPerWeek, setPostsPerWeek] = useState(user.settings.postsPerWeek);
  const [autoGenerate, setAutoGenerate] = useState(user.settings.autoGenerate);
  const [emailNotifs, setEmailNotifs] = useState(user.settings.emailNotifications);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isScale = ['scale', 'global'].includes(user.subscriptionTier ?? '');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/api/auth/me', {
        settings: {
          postsPerWeek,
          autoGenerate,
          emailNotifications: emailNotifs,
        },
      });
      onSaved();
      setSaved(true);
      toast.success('Preferences saved.');
      setTimeout(() => setSaved(false), 2500);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not save preferences.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader
        icon={<SlidersHorizontal className="w-4 h-4" />}
        title="Post Preferences"
        subtitle="Control how and when posts are generated"
      />

      <div className="p-5 space-y-5">
        {/* Posts per week */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="text-sm font-medium text-slate-800">Posts per week</p>
              <p className="text-xs text-slate-500">How many posts to generate each Monday</p>
            </div>
          </div>
          <SegmentedControl
            value={postsPerWeek}
            onChange={setPostsPerWeek}
            options={[
              { label: '2', value: 2 },
              { label: '3', value: 3 },
              { label: '5', value: 5, locked: !isScale },
            ]}
          />
          {!isScale && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              5 posts/week requires the Scale plan.{' '}
              <a href="/billing" className="underline font-medium">
                Upgrade →
              </a>
            </p>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Auto-generate</p>
              <p className="text-xs text-slate-500">
                Generate posts automatically every Monday
              </p>
            </div>
            <Toggle checked={autoGenerate} onChange={setAutoGenerate} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Email notifications</p>
              <p className="text-xs text-slate-500">
                Email me when posts are ready to review
              </p>
            </div>
            <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-1">
          <SaveButton onClick={handleSave} isSaving={isSaving} saved={saved} />
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── SECTION 3: Account ─────────────────────────────────────── */
function AccountSection({ user, onSaved }: { user: UserData; onSaved: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const hasLinkedInSession = Boolean(
    user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry).getTime() > Date.now()
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      await api.patch('/api/auth/me', { name: name.trim() });
      onSaved();
      setSaved(true);
      toast.success('Profile updated.');
      setTimeout(() => setSaved(false), 2500);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not update profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // proceed anyway
    }
    router.push('/');
  };

  return (
    <SectionCard>
      <SectionHeader
        icon={<UserIcon className="w-4 h-4" />}
        title="Account"
        subtitle="Your profile and LinkedIn sign-in session"
      />

      <div className="p-5 space-y-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-slate-100 shrink-0">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)' }}
              >
                <span className="text-xl font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500 mb-1">Display name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm text-slate-800 font-medium bg-white border border-slate-200 rounded-[8px] px-3 py-2 focus:outline-none transition-shadow duration-150"
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

        {/* Email — read-only */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Email
          </p>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-[8px]">
            <span className="text-sm text-slate-600">{user.email}</span>
            <span className="ml-auto text-[10px] font-bold text-linkedin bg-linkedin-light px-2 py-0.5 rounded-full border border-linkedin/20">
              LinkedIn
            </span>
          </div>
        </div>

        {/* LinkedIn connection */}
        <div className="flex items-center justify-between py-3 border-y border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">LinkedIn</p>
            <p className="text-xs text-slate-500">
              {hasLinkedInSession
                ? `Connected as ${user.name}`
                : 'Your LinkedIn session has expired. Reconnect to resume a fresh sign-in session.'}
            </p>
          </div>
          {hasLinkedInSession ? (
            <button
              onClick={() => setSwitchAccountOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-150"
            >
              <Unlink className="w-3.5 h-3.5" />
              Switch account
            </button>
          ) : (
            <a
              href="/linkedin?next=/settings"
              className="flex items-center gap-1.5 text-sm font-medium text-linkedin hover:text-linkedin-hover transition-colors duration-150"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Reconnect
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
          <SaveButton onClick={handleSave} isSaving={isSaving} saved={saved} />
        </div>
      </div>

      {/* Switch account confirm */}
      <Dialog open={switchAccountOpen} onOpenChange={setSwitchAccountOpen}>
        <DialogContent className="sm:max-w-sm rounded-[14px] border border-slate-200 bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Switch LinkedIn account?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            VoicePost uses LinkedIn as your sign-in method. We&apos;ll log you out first,
            then you can sign back in with the correct LinkedIn account. Your posts and
            voice profile stay in the app.
          </p>
          <div className="flex gap-2 mt-5">
            <button
              onClick={async () => {
                setSwitchAccountOpen(false);
                try {
                  await api.post('/api/auth/logout');
                } catch {
                  // continue to login even if logout request fails
                }
                window.location.href = '/login?next=/settings';
              }}
              className="flex-1 py-2 px-4 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[6px] transition-all duration-150 active:scale-[0.97]"
            >
              Log out and continue
            </button>
            <button
              onClick={() => setSwitchAccountOpen(false)}
              className="py-2 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[6px] transition-all"
            >
              Stay here
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

/* ─── SECTION 4: Billing ─────────────────────────────────────── */
function BillingSection({ user }: { user: UserData }) {
  const { data: billing, isLoading } = useSWR<BillingStatus>('/api/billing/status', fetcher);

  const statusLabel: Record<string, { label: string; style: string }> = {
    trial:     { label: 'Free trial', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    active:    { label: 'Active', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', style: 'bg-slate-100 text-slate-600 border-slate-200' },
    expired:   { label: 'Expired', style: 'bg-red-50 text-red-600 border-red-200' },
    none:      { label: 'No plan', style: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const status = statusLabel[user.subscriptionStatus] ?? statusLabel.none;

  const trialDaysLeft = user.subscriptionStatus === 'trial' && user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <SectionCard>
      <SectionHeader
        icon={<CreditCard className="w-4 h-4" />}
        title="Billing"
        subtitle="Your subscription and payment details"
      />

      <div className="p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-10 w-full rounded-[8px]" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ) : (
          <>
            {/* Plan row */}
            <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-[10px] border border-slate-100">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 capitalize">
                      {user.subscriptionTier ?? 'Free trial'}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.style}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  {trialDaysLeft !== null && (
                    <p className="text-xs text-amber-600 mt-0.5 font-medium">
                      {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                  {billing?.nextRenewalAt && user.subscriptionStatus === 'active' && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Renews{' '}
                      {new Date(billing.nextRenewalAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>

              <a
                href="/billing"
                className="flex items-center gap-1 text-sm font-medium text-linkedin hover:text-linkedin-hover transition-colors duration-150"
              >
                {user.subscriptionStatus === 'active' ? 'Change plan' : 'Upgrade'}
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Manage subscription */}
            {user.subscriptionStatus === 'active' && billing?.portalUrl && (
              <a
                href={billing.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-150"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Manage subscription
              </a>
            )}

            {/* Trial CTA */}
            {(user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'expired') && (
              <a
                href="/billing"
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] transition-all duration-150 active:scale-[0.98]"
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.10), 0 4px 12px rgba(10,102,194,0.22)' }}
              >
                View plans →
              </a>
            )}
          </>
        )}
      </div>
    </SectionCard>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, mutate } = useUser();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}
      >
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}
    >
      {/* Sticky header + trial banner */}
      <div className="sticky top-0 z-40">
        <header
          className="border-b border-slate-200/80"
          style={{
            background: 'rgba(248,250,252,0.90)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-900">Settings</h1>
          </div>
        </header>
        <TrialBanner />
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="space-y-4"
        >
          <VoiceProfileSection />
          <PostPreferencesSection user={user} onSaved={() => mutate()} />
          <AccountSection user={user} onSaved={() => mutate()} />
          <BillingSection user={user} />
        </motion.div>
      </main>
    </div>
  );
}
