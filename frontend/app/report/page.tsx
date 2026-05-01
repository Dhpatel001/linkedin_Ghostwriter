'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

type ReportDoc = {
  report: {
    voice?: {
      voiceDescription?: string;
      toneTags?: string[];
    };
    contentAudit?: {
      improvements?: string[];
    };
  };
  createdAt: string;
  source: string;
  inputMeta: {
    postCount: number;
    screenshotCount: number;
    hasLinkedInToken: boolean;
  };
};

const fetcher = (url: string) => api.get(url).then((r) => r.data.data as ReportDoc | null);

export default function ReportPage() {
  const { data, mutate, isLoading } = useSWR('/api/linkedin/report', fetcher, { revalidateOnFocus: false });
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [topics, setTopics] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadedTextPosts, setUploadedTextPosts] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ mediaType: string; data: string }[]>([]);

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
          const content = await file.text();
          const chunks = content
            .split(/\n{2,}---+\n{2,}|\n{3,}/g)
            .map((p) => p.trim())
            .filter((p) => p.length >= 20);
          textPosts.push(...chunks);
        }
      }

      setUploadedTextPosts((prev) => Array.from(new Set([...prev, ...textPosts])).slice(0, 80));
      setUploadedImages((prev) => [...prev, ...images].slice(0, 8));
    } finally {
      setUploadBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    try {
      const samplePosts = text
        .split(/\n{3,}|(?:\n{2,}---+\n{2,})/g)
        .map((p) => p.trim())
        .filter((p) => p.length >= 20)
        .slice(0, 80);
      const topicArr = topics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20);

      const mergedPosts = Array.from(new Set([...samplePosts, ...uploadedTextPosts])).slice(0, 80);

      await api.post('/api/linkedin/report', {
        samplePosts: mergedPosts,
        topics: topicArr,
        images: uploadedImages,
      });
      await mutate();
      toast.success('Report generated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not generate report'));
    } finally {
      setBusy(false);
    }
  }

  const report = data?.report;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-linkedin" />
          <h1 className="text-xl font-semibold text-slate-900">LinkedIn Report</h1>
        </div>
        <p className="text-sm text-slate-500">
          Generate a full report from LinkedIn API (if approved) and your uploaded/pasted samples.
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-900">Generate report</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder="Paste 5–30 of your LinkedIn posts here (separate posts with blank lines)."
            className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Upload samples (optional)</p>
            <input
              type="file"
              multiple
              accept=".txt,image/png,image/jpeg,image/webp"
              onChange={(e) => void readFiles(e.target.files)}
              disabled={busy || uploadBusy}
              className="text-sm"
            />
            <p className="text-xs text-slate-500">
              Added: <span className="font-semibold text-slate-700">{uploadedTextPosts.length}</span> text posts,{' '}
              <span className="font-semibold text-slate-700">{uploadedImages.length}</span> screenshots
              {uploadedImages.length > 0 && (
                <> (screenshots require <span className="font-semibold">ANTHROPIC_API_KEY</span>)</>
              )}
            </p>
          </div>
          <input
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Topics (comma separated) e.g. Product, Leadership, Startups"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            onClick={generate}
            disabled={busy || uploadBusy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-linkedin px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate report'}
          </button>
          <p className="text-xs text-slate-400">
            Tip: For best results, upload 10–30 posts or screenshots from your top-performing content.
          </p>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500">Loading report…</div>
        ) : !data ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            No report yet. Generate one above.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Latest report</p>
                <p className="text-xs text-slate-500">
                  {new Date(data.createdAt).toLocaleString('en-IN')} · source: <span className="font-semibold">{data.source}</span>
                </p>
              </div>
              <div className="text-xs text-slate-500">
                inputs: {data.inputMeta.postCount} posts, {data.inputMeta.screenshotCount} screenshots
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Voice</p>
              <p className="text-sm text-slate-700">{report?.voice?.voiceDescription}</p>
              <div className="flex flex-wrap gap-2">
                {(report?.voice?.toneTags || []).map((t: string) => (
                  <span key={t} className="text-xs font-semibold text-linkedin bg-linkedin-light border border-linkedin/20 px-2 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recommendations</p>
              <ul className="text-sm text-slate-700 space-y-1">
                {(report?.contentAudit?.improvements || []).slice(0, 8).map((r: string) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
