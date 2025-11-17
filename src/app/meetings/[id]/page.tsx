'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { firestore } from '@/utils/firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Sparkles,
  Copy,
  SendHorizonal,
  Users,
} from 'lucide-react';

type AutomationPost = {
  automationId: string;
  automationName: string;
  platform: 'linkedin' | 'facebook';
  content: string;
  createdAt?: number;
};

type AutomationConfig = {
  id: string;
  name: string;
  platform: 'linkedin' | 'facebook';
  prompt: string;
};

export default function MeetingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const auth = getAuth();

  const [uid, setUid] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<any>(null);

  const [copyMsg, setCopyMsg] = useState('');
  const [posting, setPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<{
    message: string;
    isError?: boolean;
  } | null>(null);

  // AUTOMATIONS
  const [availableAutomations, setAvailableAutomations] = useState<AutomationConfig[]>([]);
  const [selectedAutomationNames, setSelectedAutomationNames] = useState<string[]>([]);
  const [savingAutomations, setSavingAutomations] = useState(false);

  /* -------------------- AUTH -------------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/login');
      else setUid(user.uid);
    });
    return () => unsub();
  }, [auth, router]);

  /* -------------------- LOAD MEETING -------------------- */
  async function fetchMeeting() {
    if (!id || !uid) return;

    try {
      const ref = doc(firestore, 'meetings_v2', id as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // fallback MUST include userId to satisfy Firestore rules
        setMeeting({
          title: 'Untitled meeting',
          attendees: [],
          startTime: new Date().toISOString(),
          transcript: 'Transcript processing… (fallback)',
          followUpEmailDraft: 'Follow-up email goes here… (fallback)',
          socialPostDraft: 'Had a productive meeting today! (fallback)',
          automations: [],
          automationPosts: [],
          userId: uid, // CRITICAL FIX
        });
        return;
      }

      const data = snap.data();

      setMeeting({
        ...data,
        title: data.title || 'Untitled meeting',
        attendees: data.attendees || [],
        startTime: data.startTime || new Date().toISOString(),
        transcript: data.transcript || 'Transcript processing…',
        followUpEmailDraft: data.followUpEmailDraft || '',
        socialPostDraft: data.socialPostDraft || '',
        automations: data.automations || [],
        automationPosts: data.automationPosts || [],
        userId: data.userId || uid, // ENSURE userId ALWAYS EXISTS
      });

      if (Array.isArray(data.automations)) {
        setSelectedAutomationNames(data.automations);
      }
    } catch (err) {
      // fallback MUST include userId
      setMeeting({
        title: 'Untitled meeting',
        attendees: [],
        startTime: new Date().toISOString(),
        transcript: 'Transcript unavailable. (fallback)',
        followUpEmailDraft: 'Follow-up email goes here… (fallback)',
        socialPostDraft: 'Today’s meeting went great! (fallback)',
        automations: [],
        automationPosts: [],
        userId: uid, // CRITICAL FIX
      });
    } finally {
      setLoading(false);
    }
  }

  /* -------------------- LOAD AUTOMATIONS -------------------- */
  async function fetchAutomations(userId: string) {
    try {
      const q = query(
        collection(firestore, 'automations'),
        where('uid', '==', userId)
      );

      const snap = await getDocs(q);

      const items: AutomationConfig[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setAvailableAutomations(items);
    } catch {}
  }

  /* -------------------- INITIAL LOAD -------------------- */
  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      setLoading(true);
      try {
        await fetch('/api/recall/poll', { method: 'POST' }).catch(() => {});
      } finally {
        await fetchMeeting();
      }
    };

    if (id && uid) run();
  }, [id, uid]);

  useEffect(() => {
    if (uid) fetchAutomations(uid);
  }, [uid]);

  /* -------------------- HELPERS -------------------- */
  const copy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 1500);
  };

  const toggleAutomationSelection = (name: string) => {
    setSelectedAutomationNames((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  /* -------------------- SAVE AUTOMATIONS (FULLY FIXED) -------------------- */
  const saveAutomationsForMeeting = async () => {
    if (!id || !meeting || !meeting.userId) return;

    setSavingAutomations(true);
    setPostStatus(null);

    try {
      const ref = doc(firestore, 'meetings_v2', id as string);

      await updateDoc(ref, {
        automations: selectedAutomationNames,
        userId: meeting.userId, // REQUIRED BY FIRESTORE RULES
      });

      // Update UI immediately
      setMeeting((prev: any) =>
        prev ? { ...prev, automations: selectedAutomationNames } : prev
      );

      setPostStatus({ message: 'Automations updated for this meeting.' });
    } catch (err) {
      console.error('Error saving automations for meeting:', err);
      setPostStatus({ message: 'Failed to update automations.', isError: true });
    } finally {
      setSavingAutomations(false);
      setTimeout(() => setPostStatus(null), 3000);
    }
  };

  /* -------------------- RENDER -------------------- */
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

  const automationPosts: AutomationPost[] = Array.isArray(meeting.automationPosts)
    ? meeting.automationPosts
    : [];

  return (
    <main className="px-6 py-8 max-w-4xl mx-auto space-y-10">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-black"
      >
        <ArrowLeft size={18} /> Back
      </button>

      {/* Title */}
      <h1 className="text-2xl font-semibold">
        {meeting.title || 'Untitled meeting'}
      </h1>
      <p className="text-gray-500 text-sm">
        {new Date(meeting.startTime).toLocaleString()}
      </p>

      {/* Attendees */}
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

      {/* Transcript */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Mail size={18} /> Meeting Transcript
        </h2>
        <div className="border rounded-xl p-4 bg-white shadow-sm text-sm leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
          {meeting.transcript || 'Transcript processing…'}
        </div>
      </section>

      {/* Follow-Up Email */}
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

      {/* Configure Automations */}
      <section className="pt-4 border-t border-gray-100">
        <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Sparkles size={18} /> Configure Automations for This Meeting
        </h2>

        {availableAutomations.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't created any automations yet.</p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">
              Select which automations should be applied to this meeting.
            </p>

            <div className="space-y-2">
              {availableAutomations.map((auto: AutomationConfig) => (
                <label key={auto.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedAutomationNames.includes(auto.name)}
                    onChange={() => toggleAutomationSelection(auto.name)}
                  />
                  <span className="font-medium">{auto.name}</span>
                  <span className="text-xs uppercase text-gray-400">
                    {auto.platform}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={saveAutomationsForMeeting}
              disabled={savingAutomations}
              className="mt-3 inline-flex items-center gap-2 text-sm px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            >
              {savingAutomations ? 'Saving…' : 'Save automations'}
            </button>
          </>
        )}
      </section>

      {/* Social Posts */}
      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Sparkles size={18} /> Social Media Posts
        </h2>

        {automationPosts.length > 0 ? (
          <div className="space-y-4">
            {automationPosts.map((post: AutomationPost) => (
              <div
                key={`${post.automationId}-${post.platform}`}
                className="border rounded-xl p-4 bg-white shadow-sm"
              >
                <p className="text-xs uppercase text-gray-500">{post.platform}</p>
                <p className="font-semibold">{post.automationName}</p>
                <p className="text-sm whitespace-pre-wrap text-gray-800 mt-2">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <p className="text-sm whitespace-pre-wrap text-gray-800">
              {meeting.socialPostDraft || 'Generating…'}
            </p>
          </div>
        )}
      </section>

      {/* Automations Triggered */}
      <section className="pt-4">
        <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Sparkles size={18} /> Automations Triggered
        </h2>

        {meeting.automations?.length ? (
          <ul className="list-disc ml-6 text-sm text-gray-700">
            {meeting.automations.map((a: string) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">None configured</p>
        )}
      </section>

    </main>
  );
}
