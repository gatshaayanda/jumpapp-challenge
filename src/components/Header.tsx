'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import LogoMktMark from '@/components/LogoMktMark';
import LogoMkt from '@/components/LogoMkt';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

/* Firebase Init */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};
initializeApp(firebaseConfig);

/* Top Navigation */
const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Meetings', href: '/meetings' },
  { label: 'Settings', href: '/settings' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const closeMenu = () => setOpen(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      router.push('/login');
    } catch {}
  };

  return (
    <header className="w-full bg-white text-black border-b border-[--border] sticky top-0 z-50">

      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 
        bg-black text-white px-3 py-2 rounded"
      >
        Skip to content
      </a>

      {/* Main Row */}
      <div className="container flex items-center justify-between py-3">

        {/* Left: Logo + Wordmark */}
        <Link
          href="/dashboard"
          onClick={closeMenu}
          aria-label="MeetingPost AI — Home"
          className="flex items-center gap-3 select-none"
        >
          {/* icon */}
          <LogoMktMark className="h-8 w-8" />

          {/* wordmark */}
          <LogoMkt className="h-6" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={`text-sm font-medium hover:opacity-70 transition ${
                isActive(item.href)
                  ? 'border-b-2 border-black pb-1'
                  : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded bg-black text-white text-sm font-medium hover:opacity-80 transition"
            >
              Log In
            </Link>
          ) : (
            <>
              <span className="text-sm opacity-70">{user.email}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm hover:opacity-70"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="md:hidden p-2 text-black"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden border-t border-[--border] bg-white">
          <div className="flex flex-col gap-4 px-4 py-4">

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="text-base font-medium text-black"
              >
                {item.label}
              </Link>
            ))}

            <div className="h-px bg-[--border]" />

            {!user ? (
              <Link
                href="/login"
                className="w-full text-center py-2 rounded bg-black text-white font-medium"
                onClick={closeMenu}
              >
                Log In
              </Link>
            ) : (
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="w-full text-center inline-flex items-center justify-center gap-2 py-2 rounded bg-black text-white"
              >
                <LogOut size={18} /> Logout
              </button>
            )}
          </div>
        </div>
      )}

    </header>
  );
}
