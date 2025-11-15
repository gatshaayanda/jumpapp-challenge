'use client';

import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 text-[--foreground] bg-[--brand-primary] relative overflow-hidden">

      {/* Gold shimmer top line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[--brand-secondary]/40 via-[--brand-secondary]/80 to-[--brand-secondary]/40 animate-goldflow" />

      <div className="container grid gap-10 sm:grid-cols-2 lg:grid-cols-3 py-12 text-sm relative z-10">

        {/* BRAND SECTION */}
        <section>
          <h4 className="font-serif text-lg text-[--brand-secondary] mb-2 tracking-wide">
            MeetingPost AI
          </h4>
          <p className="text-[--brand-accent]/90 leading-relaxed">
            Generate social media content automatically from your client meetings.
            Powered by AI. Designed for advisors.
          </p>
        </section>

        {/* QUICK LINKS */}
        <nav>
          <h4 className="font-serif text-lg text-[--brand-secondary] mb-2 tracking-wide">
            Navigation
          </h4>
          <ul className="space-y-1 text-[--brand-accent]/90">
            <li><Link href="/" className="hover:underline">Dashboard</Link></li>
            <li><Link href="/meetings" className="hover:underline">Past Meetings</Link></li>
            <li><Link href="/settings" className="hover:underline">Settings</Link></li>
            <li>
              <Link href="/login" className="text-[--brand-secondary] font-medium hover:underline">
                Sign In
              </Link>
            </li>
          </ul>
        </nav>

        {/* BUILT BY / SOCIAL */}
        <section>
          <h4 className="font-serif text-lg text-[--brand-secondary] mb-2 tracking-wide">
            Developer Info
          </h4>

          <p className="text-[--brand-accent]/90 leading-relaxed">
            Prototype built by <span className="font-semibold text-[--brand-secondary]">
              Ayanda Gatsha
            </span> for the Jump Hiring Challenge.
          </p>

          <div className="mt-4 space-y-2 text-[--brand-accent]/90">
            <a
              href="https://github.com/kaygatsha"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[--brand-secondary] transition"
            >
              <Github size={16} />
              <span className="text-sm">View GitHub</span>
            </a>

            <a
              href="https://jumpcut.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[--brand-secondary] transition"
            >
              <ExternalLink size={16} />
              <span className="text-sm">Jump Challenge Info</span>
            </a>
          </div>
        </section>

      </div>

      {/* Lower Strip */}
      <div className="border-t border-[--brand-accent]/30 relative z-10">
        <div className="container py-4 flex flex-col md:flex-row justify-between text-xs text-[--brand-accent]/80 gap-2">
          <div>&copy; {year} MeetingPost AI. All rights reserved.</div>
          <div>Built with Next.js, Tailwind, Firebase & Recall.ai</div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes goldflow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-goldflow {
          background-size: 200% 200%;
          animation: goldflow 6s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
}
