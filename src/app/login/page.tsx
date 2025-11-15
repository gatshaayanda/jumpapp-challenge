'use client';

import { useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) router.replace('/events');
    });
    return () => unsub();
  }, [auth, router]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/events');
    } catch (err) {
      console.error('Login failed:', err);
      alert('Google Login failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-xl p-8 shadow-lg bg-white text-black">
        <h1 className="text-2xl font-bold mb-6">Welcome</h1>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg hover:opacity-90"
        >
          <LogIn size={18} /> Sign in with Google
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Powered by Firebase Authentication
        </p>
      </div>
    </main>
  );
}
