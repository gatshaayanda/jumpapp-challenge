'use client';

import { useEffect, useState } from 'react';

export default function ScentsSuitesLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setFading(true), 2300);
    const hide = setTimeout(() => setVisible(false), 3100);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Loading Scents & Suites"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-[1200ms] ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 50%, #4C1F26, #2a1b1b 70%, #1a1212 100%)',
        backgroundSize: '200% 200%',
        animation: 'bgFlow 8s cubic-bezier(0.45,0,0.25,1) infinite',
        color: '#fff',
        fontFamily: 'var(--font-serif)',
      }}
    >
      {/* Perfume Droplet */}
      <div className="relative h-28 w-28 mb-6">
        {/* Subtle Reflection */}
        <svg
          viewBox="0 0 64 64"
          className="absolute inset-0 opacity-25 blur-sm scale-y-[-1] translate-y-8"
        >
          <path
            d="M32 2C26 12 16 24 16 36c0 8.8 7.2 16 16 16s16-7.2 16-16c0-12-10-24-16-34Z"
            fill="#B89B59"
          />
        </svg>

        {/* Main Droplet */}
        <svg
          viewBox="0 0 64 64"
          width="112"
          height="112"
          className="animate-float drop-glow"
        >
          <defs>
            <radialGradient id="dropGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFE6A3" stopOpacity="0.9">
                <animate
                  attributeName="offset"
                  values="0;0.4;0"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#B89B59" />
            </radialGradient>
          </defs>
          <path
            d="M32 2C26 12 16 24 16 36c0 8.8 7.2 16 16 16s16-7.2 16-16c0-12-10-24-16-34Z"
            fill="url(#dropGlow)"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div
        className="text-white uppercase tracking-[0.5em] text-[1.6rem] fade-in-text"
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 600,
        }}
      >
        Scents & Suites
      </div>

      {/* Tagline */}
      <div
        className="text-sm mt-2 text-[#D6B678] tracking-widest fade-in-delayed"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '0.25em',
        }}
      >
        Where Elegance Has a Scent
      </div>

      {/* Progress shimmer bar */}
      <div
        className="w-48 h-1.5 bg-white/10 overflow-hidden rounded-full mt-8"
        aria-hidden="true"
      >
        <span
          className="block h-full w-1/3 shimmer"
          style={{ background: 'linear-gradient(90deg,#B89B59,#D6B678,#B89B59)' }}
        />
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          50% { transform: translateX(30%); }
          100% { transform: translateX(150%); }
        }
        .shimmer {
          animation: shimmer 2.2s cubic-bezier(0.45,0,0.25,1) infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 4.5s cubic-bezier(0.45,0,0.25,1) infinite;
        }

        @keyframes bgFlow {
          0%, 100% { background-position: 50% 50%; }
          50% { background-position: 55% 60%; }
        }

        .drop-glow {
          filter: drop-shadow(0 0 10px rgba(184,155,89,0.55))
                  drop-shadow(0 0 18px rgba(214,182,120,0.25));
          transition: filter 1s ease;
        }

        @keyframes fadeInText {
          0% { opacity: 0; letter-spacing: 0.4em; transform: translateY(6px); }
          100% { opacity: 1; letter-spacing: 0.15em; transform: translateY(0); }
        }
        .fade-in-text {
          animation: fadeInText 1.6s cubic-bezier(0.45,0,0.25,1) forwards;
        }
        .fade-in-delayed {
          opacity: 0;
          animation: fadeInText 1.6s cubic-bezier(0.45,0,0.25,1) 0.5s forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
