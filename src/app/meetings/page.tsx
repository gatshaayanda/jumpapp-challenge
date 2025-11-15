'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firestore } from '@/utils/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { CalendarClock, Users, Loader2 } from 'lucide-react';

type Meeting = {
  id: string;
  title: string;
  startTime: string;          // ISO string
  platform: 'zoom' | 'meet' | 'teams' | 'other';
  attendees: string[];
  transcriptReady?: boolean;
};

export default function MeetingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Helpers
  const platformLabel = (p: Meeting['platform']) => {
    switch (p) {
      case 'zoom':
        return 'Zoom';
      case 'meet':
        return 'Google Meet';
      case 'teams':
        return 'Microsoft Teams';
      default:
        return 'Other';
    }
  };

  const platformColor = (p: Meeting['platform']) => {
    switch (p) {
      case 'zoom':
        return 'bg-[#0b5cff] text-white';
      case 'meet':
        return 'bg-[#0f9d58] text-white';
      case 'teams':
        return 'bg-[#464eb8] text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Load current user + meetings
  useEffect(() => {
    const auth = getAuth();

    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace('/login');
        return;
      }

      setUserId(u.uid);
      try {
        const q = query(
          collection(firestore, 'meeting_metadata'),
          where('userId', '==', u.uid),
          orderBy('startTime', 'desc')
        );
        const snap = await getDocs(q);

        const data: Meeting[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          return {
            id: docSnap.id,
            title: d.title || d.summary || 'Untitled meeting',
            startTime: d.startTime,
            platform: d.platform || 'other',
            attendees: d.attendees || [],
            transcriptReady: !!d.transcript,
          };
        });

        setMeetings(data);
      } catch (err) {
        console.error('Error loading meetings', err);
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="animate-spin mr-2" /> Loading past meetings…
      </main>
    );
  }

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
        <CalendarClock size={22} /> Past Meetings
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        These meetings had notetakers enabled. Click a row to see the transcript,
        follow-up email, and social post drafts.
      </p>

      {meetings.length === 0 && (
        <p className="text-gray-500 mt-8">
          No past meetings found yet. Once your Recall.ai bots finish recording,
          they’ll appear here.
        </p>
      )}

      <div className="space-y-3">
        {meetings.map((m) => (
          <button
            key={m.id}
            onClick={() => router.push(`/meetings/${m.id}`)}
            className="w-full text-left border rounded-xl p-4 bg-white hover:bg-gray-50 transition flex justify-between items-center shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-medium text-base">{m.title}</h2>
                {m.transcriptReady && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Transcript ready
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {new Date(m.startTime).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Users size={14} />
                <span>
                  {m.attendees && m.attendees.length
                    ? m.attendees.join(', ')
                    : 'Attendees unknown'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${platformColor(
                  m.platform
                )}`}
              >
                {platformLabel(m.platform)}
              </span>
              <span className="text-xs text-gray-400">
                View details →
              </span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
