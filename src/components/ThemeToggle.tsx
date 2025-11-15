'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to <html> and store it
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Toggle handler
  const toggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full transition-all duration-300 text-[--brand-secondary] hover:text-[--brand-accent]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={20} className="transition-transform duration-300 rotate-0 hover:rotate-90" />
      ) : (
        <Moon size={20} className="transition-transform duration-300 rotate-0 hover:-rotate-90" />
      )}
    </button>
  );
}
