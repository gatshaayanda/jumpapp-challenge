'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, LogIn } from 'lucide-react';

export default function ClientLoginPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/client-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });

    if (res.ok) {
      const { email } = await res.json();
      document.cookie = `role=${encodeURIComponent(email)}; path=/; max-age=${60 * 60 * 24}`;
      router.push('/client/dashboard');
    } else {
      const { error: msg } = await res.json();
      setError(msg || 'Login failed');
      setPw('');
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[--brand-primary] text-white px-6 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[--brand-primary] via-[#3b171c] to-[#4c1f26] opacity-95" />

      {/* Glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,182,120,0.1)_0%,transparent_70%)]" />

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white/95 backdrop-blur-sm text-[--brand-primary] rounded-2xl shadow-lg border border-[--brand-secondary]/30 w-full max-w-md p-8 animate-fadeIn"
      >
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-[--brand-secondary]/20 text-[--brand-secondary] shadow-glow-gold">
            <Lock size={22} />
          </div>
          <h1 className="text-2xl font-serif font-semibold tracking-wide text-[--brand-primary]">
            Client Login
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Enter your secure access password to view your dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium text-[--brand-secondary]">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-full border border-gray-300 text-sm text-[--foreground] bg-white focus:ring-2 focus:ring-[--brand-secondary]/40 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-medium bg-[--brand-secondary] text-[--brand-primary] hover:brightness-110 transition shadow-glow-gold"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? 'Logging In…' : 'Login'}
          </button>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </div>
      </form>

      {/* Decorative bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-[30vh] bg-gradient-to-t from-[--brand-primary] to-transparent" />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .shadow-glow-gold {
          box-shadow: 0 0 12px rgba(214, 182, 120, 0.4);
        }
        .shadow-glow-gold:hover {
          box-shadow: 0 0 20px rgba(214, 182, 120, 0.6);
        }
      `}</style>
    </main>
  );
}
