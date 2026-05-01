'use client';

import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import useSWR from 'swr';
import { getErrorMessage } from '@/lib/errors';

interface WorkspaceMember {
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'invited';
}

interface Workspace {
  name: string;
  members: WorkspaceMember[];
}

const fetcher = (url: string) => api.get(url).then((r) => r.data.data as Workspace | null);

export default function TeamPage() {
  const { data, mutate, isLoading } = useSWR('/api/team/workspace', fetcher);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [busy, setBusy] = useState(false);

  async function createWorkspace() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post('/api/team/workspace', { name: name.trim() });
      setName('');
      await mutate();
      toast.success('Workspace created');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not create workspace'));
    } finally {
      setBusy(false);
    }
  }

  async function inviteMember() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post('/api/team/workspace/invite', { email: email.trim(), role });
      setEmail('');
      await mutate();
      toast.success('Invitation added');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Could not invite member'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-linkedin" />
          <h1 className="text-xl font-semibold text-slate-900">Team Workspace</h1>
        </div>

        {!data && !isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <p className="text-sm text-slate-600">Create a workspace to collaborate with editors and reviewers.</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                onClick={createWorkspace}
                disabled={busy}
                className="rounded-lg bg-linkedin px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900 mb-1">{data.name}</h2>
              <p className="text-xs text-slate-500">Members: {data.members.length}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Invite member</h3>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 min-w-[220px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={inviteMember}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg bg-linkedin px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Invite
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Team members</h3>
              <div className="space-y-2">
                {data.members.map((member) => (
                  <div key={member.email} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <div>
                      <p className="text-sm text-slate-800">{member.email}</p>
                      <p className="text-xs text-slate-500">{member.status}</p>
                    </div>
                    <span className="text-xs font-semibold text-linkedin uppercase">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
