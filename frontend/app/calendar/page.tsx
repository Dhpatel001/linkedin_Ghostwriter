'use client';

import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CalendarPage() {
  const { posts: approved, isLoading } = usePosts('approved');
  const scheduled = useMemo(
    () => approved.filter((post) => post.scheduledFor).sort((a, b) => {
      return new Date(a.scheduledFor || 0).getTime() - new Date(b.scheduledFor || 0).getTime();
    }),
    [approved]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-5 h-5 text-linkedin" />
          <h1 className="text-xl font-semibold text-slate-900">Content Calendar</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">Your scheduled approved posts in one timeline view.</p>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading scheduled posts...</p>
        ) : scheduled.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No scheduled posts yet. Use the dashboard to schedule approved posts.
          </div>
        ) : (
          <div className="space-y-3">
            {scheduled.map((post) => (
              <div key={post._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-linkedin mb-2">{formatDate(post.scheduledFor)}</div>
                <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">{post.topic}</div>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {(post.editedContent || post.content).slice(0, 240)}
                  {(post.editedContent || post.content).length > 240 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
