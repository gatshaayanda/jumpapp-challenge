'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      id="main"
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
    >
      {/* HERO */}
      <section className="border-b border-[--border]">
        <div className="container py-16 md:py-20 flex flex-col md:flex-row items-start gap-10">
          {/* Left: headline */}
          <div className="flex-1 space-y-6">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[--accent-muted]">
              Jump Hiring Challenge • Prototype
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold leading-tight">
              Turn client meetings into social media posts in minutes.
            </h1>

            <p className="text-sm md:text-base text-[--accent-muted] max-w-xl">
              MeetingPost AI connects to your calendar, sends a notetaker bot into
              your calls via Recall.ai, and then turns the transcript into
              draft posts you can review and publish to LinkedIn or Facebook.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-full  text-white text-sm font-semibold hover:opacity-85 transition"
              >
                Open dashboard
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-full border border-[--border] text-sm font-medium hover:bg-[--surface] transition"
              >
                Log in with Google
              </Link>
            </div>

            <p className="text-xs text-[--accent-muted] pt-2">
              Once you’re signed in, connect your Google Calendar, choose which
              meetings should have a notetaker, and we’ll handle the rest.
            </p>
          </div>

          {/* Right: how it works */}
          <div className="w-full md:max-w-sm">
            <div className="card">
              <h2 className="text-base font-semibold mb-3">
                How it works
              </h2>
              <ol className="space-y-3 text-sm">
                <li>
                  <span className="font-semibold">1. Connect Google Calendar.</span>{' '}
                  We pull in meetings from all connected accounts.
                </li>
                <li>
                  <span className="font-semibold">2. Send a notetaker.</span>{' '}
                  Toggle which meetings should have a Recall.ai bot join a few minutes
                  before they start.
                </li>
                <li>
                  <span className="font-semibold">3. Generate & post.</span>{' '}
                  After the meeting, view the transcript, follow-up email draft,
                  and social post suggestions — then copy or post directly.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* SECONDARY SECTION: capabilities */}
      <section className="border-b border-[--border]">
        <div className="container py-10 md:py-14">
          <h2 className="text-lg md:text-xl font-serif font-semibold mb-4">
            What you can do with MeetingPost AI
          </h2>
          <div className="grid gap-6 md:grid-cols-3 text-sm">
            <div className="card">
              <h3 className="font-semibold mb-1">See your meetings</h3>
              <p className="text-[--accent-muted]">
                A single view of upcoming and past meetings across connected
                Google accounts, with a simple toggle for notetaker attendance.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-1">Review transcripts</h3>
              <p className="text-[--accent-muted]">
                Open any past meeting to read the full transcript, plus an
                AI-generated follow-up email you can quickly adapt and send.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-1">Post to social</h3>
              <p className="text-[--accent-muted]">
                Configure automations for LinkedIn and Facebook, generate
                post drafts per meeting, and publish as yourself with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTNOTE STRIP */}
      <section>
        <div className="container py-8 text-xs text-[--accent-muted] flex flex-col md:flex-row gap-2 justify-between">
          <p>
            This is a focused prototype built for the Jump Hiring Challenge.
            Core flows: Google login, calendar sync, Recall.ai notetaker,
            transcripts, and social post generation.
          </p>
          <p>
            Ready?{' '}
            <Link href="/login" className="underline hover:opacity-80">
              Log in and connect your calendar
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
