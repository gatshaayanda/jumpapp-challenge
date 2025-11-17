'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Settings, Link, Clock, Calendar, CheckCircle2 } from 'lucide-react';

type ConnectionState = {
  linkedin?: {
    name: string | null;
    connectedAt: string | null;
  } | null;
  facebook?: {
    pageName: string | null;
    connectedAt: string | null;
  } | null;
};

export default function SettingsPage() {
  const auth = getAuth();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [joinMinutes, setJoinMinutes] = useState(5);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [connections, setConnections] = useState<ConnectionState>({});

  // LOAD USER + SETTINGS
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace('/login');
        return;
      }

      setUser(u);
      ensureServerSession(u);
      loadSettings(u);
    });
  }, [auth, router]);

  async function loadSettings(u: User) {
    try {
      const res = await fetch(`/api/user/settings?uid=${u.uid}`);
      const data = await res.json();
      if (data.joinMinutes) setJoinMinutes(data.joinMinutes);
      if (data.connections) setConnections(data.connections);
    } catch (err) {
      console.error(err);
    }
  }

  async function ensureServerSession(u: User) {
    try {
      const token = await u.getIdToken();
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (err) {
      console.error('Failed to sync server session', err);
    }
  }

  // SAVE SETTINGS
  async function saveSettings() {
    if (!user) return;
    setSaving(true);
    setStatus('');

    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        joinMinutes,
      }),
    });

    if (res.ok) setStatus('Saved ✓');
    else setStatus('Error saving');

    setSaving(false);
  }

  // OAUTH CONNECTIONS
  function connectGoogle() {
    window.location.href = '/api/google/start';
  }

  function connectLinkedIn() {
    if (!user) return;
    window.location.href = `/api/oauth/linkedin/start`;
  }

  function connectFacebook() {
    if (!user) return;
    window.location.href = `/api/oauth/facebook/start`;
  }

  return (
    <main className="min-h-screen bg-white text-black p-6 font-sans">
      <header className="flex items-center gap-3 mb-10">
        <Settings size={26} />
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      {/* OAuth Connections */}
      <section className="mb-12 space-y-6 max-w-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link size={20} /> Connected Accounts
        </h2>

        <button
          className="w-full bg-[#4285F4] text-white px-4 py-3 rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
          onClick={connectGoogle}
        >
          <Calendar size={18} /> Connect Google Calendar
        </button>

        <button
          className="w-full bg-[#0077b5] text-white px-4 py-3 rounded-lg font-medium hover:opacity-90"
          onClick={connectLinkedIn}
        >
          {connections.linkedin ? 'LinkedIn Connected' : 'Connect LinkedIn'}
        </button>
        {connections.linkedin && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <CheckCircle2 size={14} />
            {connections.linkedin.name || 'LinkedIn profile'} connected
            {connections.linkedin.connectedAt &&
              ` (${new Date(connections.linkedin.connectedAt).toLocaleDateString()})`}
          </p>
        )}

        <button
          className="w-full bg-[#1877f2] text-white px-4 py-3 rounded-lg font-medium hover:opacity-90"
          onClick={connectFacebook}
        >
          {connections.facebook ? 'Facebook Page Connected' : 'Connect Facebook'}
        </button>
        {connections.facebook && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <CheckCircle2 size={14} />
            {connections.facebook.pageName || 'Facebook page'} connected
            {connections.facebook.connectedAt &&
              ` (${new Date(connections.facebook.connectedAt).toLocaleDateString()})`}
          </p>
        )}
      </section>

      {/* Bot Join Timing */}
      <section className="max-w-lg space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock size={20} /> Notetaker Timing
        </h2>

        <p className="text-sm text-gray-600">
          How many minutes before a meeting should the Recall.ai bot join?
        </p>

        <input
          type="number"
          value={joinMinutes}
          onChange={(e) => setJoinMinutes(Number(e.target.value))}
          className="w-32 border border-gray-300 px-3 py-2 rounded-md text-black"
          min={1}
          max={60}
        />

        <button
          disabled={saving}
          onClick={saveSettings}
          className="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:opacity-80 transition"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>

        {status && (
          <p className="text-sm text-green-700 font-medium">{status}</p>
        )}
      </section>
    </main>
  );
}
