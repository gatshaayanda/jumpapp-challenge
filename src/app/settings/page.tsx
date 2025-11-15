'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Settings, Link, Clock } from 'lucide-react';

export default function SettingsPage() {
  const auth = getAuth();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [joinMinutes, setJoinMinutes] = useState(5);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.replace('/login');
      setUser(u);
      loadSettings(u);
    });
  }, []);

  async function loadSettings(u: any) {
    try {
      const res = await fetch(`/api/user/settings?uid=${u.uid}`);
      const data = await res.json();
      if (data.joinMinutes) setJoinMinutes(data.joinMinutes);
    } catch (err) {
      console.error(err);
    }
  }

  async function saveSettings() {
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

    if (res.ok) {
      setStatus('Saved ✓');
    } else {
      setStatus('Error saving');
    }

    setSaving(false);
  }

  function connectLinkedIn() {
    window.location.href = '/api/oauth/linkedin/start';
  }

  function connectFacebook() {
    window.location.href = '/api/oauth/facebook/start';
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
          className="w-full bg-[#0077b5] text-white px-4 py-3 rounded-lg font-medium hover:opacity-90"
          onClick={connectLinkedIn}
        >
          Connect LinkedIn
        </button>

        <button
          className="w-full bg-[#1877f2] text-white px-4 py-3 rounded-lg font-medium hover:opacity-90"
          onClick={connectFacebook}
        >
          Connect Facebook
        </button>
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
