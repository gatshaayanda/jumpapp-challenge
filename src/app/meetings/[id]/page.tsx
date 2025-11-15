'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firestore } from '@/utils/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Sparkles,
  Copy,
  SendHorizonal,
  Users,
} from 'lucide-react';

export default function MeetingDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<any>(null);
  const [copyMsg, setCopyMsg] = useState('');

  async function fetchMeeting() {
    try {
      const ref = doc(firestore, 'meeting_metadata', id as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setMeeting(null);
      } else {
        setMeeting(snap.data());
      }
    } catch (err) {
      console.error('Error loading meeting detail:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeeting();
  }, []);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 1500);
  };

  const handlePost = async () => {
    try {
      const res = await fetch('/api/post-to-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: id,
          content: meeting?.socialPostDraft,
          platform: meeting?.automationPlatform || 'linkedin',
        }),
      });

      if (res.ok) {
        alert('Posted successfully!');
      } else {
        alert('Post failed.');
      }
    } catch (err) {
      alert('Error posting.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="animate-spin mr-2" /> Loading…
      </main>
    );
  }

  if (!meeting) {
    return (
      <main className="p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <p className="text-gray-500">Meeting not found.</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 max-w-4xl mx-auto space-y-10">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-black"
      >
        <ArrowLeft size={18} /> Back
      </button>

      {/* Title */}
      <h1 className="text-2xl font-semibold">{meeting.title}</h1>
      <p className="text-gray-500 text-sm">
        {new Date(meeting.startTime).toLocaleString()}
      </p>

      {/* ATTENDEES */}
      <section>
        <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Users size={18} /> Attendees
        </h2>
        <p className="text-gray-700 text-sm">
          {meeting.attendees?.length
            ? meeting.attendees.join(', ')
            : 'No attendees recorded'}
        </p>
      </section>

      {/* TRANSCRIPT */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Mail size={18} /> Meeting Transcript
        </h2>

        <div className="border rounded-xl p-4 bg-white shadow-sm text-sm leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
          {meeting.transcript || 'Transcript processing…'}
        </div>
      </section>

      {/* FOLLOW-UP EMAIL DRAFT */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Mail size={18} /> Follow-up Email (AI Generated)
        </h2>

        <div className="border rounded-xl p-4 bg-white shadow-sm text-sm whitespace-pre-wrap">
          {meeting.followUpEmailDraft || 'Generating…'}
        </div>

        <button
          onClick={() => copy(meeting.followUpEmailDraft || '')}
          className="mt-3 inline-flex items-center gap-2 text-sm px-3 py-2 rounded bg-black text-white"
        >
          <Copy size={16} /> Copy Email
        </button>
      </section>

      {/* SOCIAL MEDIA POST DRAFT */}
      <section>
        <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Sparkles size={18} /> Social Media Post Draft
        </h2>

        <div className="border rounded-xl p-4 bg-white shadow-sm text-sm whitespace-pre-wrap">
          {meeting.socialPostDraft || 'Generating…'}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => copy(meeting.socialPostDraft || '')}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded bg-gray-700 text-white"
          >
            <Copy size={16} /> Copy
          </button>

          <button
            onClick={handlePost}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded bg-blue-600 text-white"
          >
            <SendHorizonal size={16} /> Post
          </button>
        </div>

        {copyMsg && (
          <p className="text-xs text-green-600 mt-2">{copyMsg}</p>
        )}
      </section>

      {/* AUTOMATIONS SHOWCASE */}
      <section className="pt-4">
        <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Sparkles size={18} /> Automations Triggered
        </h2>

        {Array.isArray(meeting.automations) &&
        meeting.automations.length > 0 ? (
          <ul className="list-disc ml-6 text-sm text-gray-700">
            {meeting.automations.map((a: string) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">None triggered</p>
        )}
      </section>
    </main>
  );
}
