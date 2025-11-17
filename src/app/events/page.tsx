'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { firestore } from '@/utils/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Calendar, Loader2, AlertTriangle } from 'lucide-react';
import {
  extractJoinUrl,
  detectPlatform,
  type CalendarEventForLinks,
} from '@/utils/meetingLinks';

type CalendarAttendee = {
  email?: string;
  displayName?: string;
};

type GEvent = CalendarEventForLinks & {
  id: string;
  internalId: string;
  accountId: string;
  sourceEmail?: string;
  start: { dateTime?: string; date?: string };
  attendees?: CalendarAttendee[];
};

type EventsResponse = {
  events?: GEvent[];
  errors?: { accountId: string; message: string }[];
};

/* -------------------------------------------------------------
   COMPONENT
-------------------------------------------------------------- */
export default function EventsPage() {
  const [events, setEvents] = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<{ accountId: string; message: string }[]>([]);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUserId(u.uid);

      try {
        await syncServerSession(u);
        const token = await u.getIdToken();

        const res = await fetch('/api/google/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json: EventsResponse = await res.json();

        // Expect the server to include description/location/conferenceData.
        setEvents(json.events || []);
        setErrors(json.errors || []);

        // Load toggle state from Firestore
        const userDoc = await getDoc(doc(firestore, 'users', u.uid));
        if (userDoc.exists()) {
          setToggles(userDoc.data().eventToggles || {});
        }
      } catch (e) {
        console.error('Error loading events:', e);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function syncServerSession(u: User) {
    try {
      const token = await u.getIdToken();
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (err) {
      console.error('Failed to sync server session', err);
    }
  }

  const onToggle = async (eventKey: string, value: boolean) => {
    if (!userId) return;

    // Fix: use the computed next state to avoid stale closure in setDoc payload
    const next = { ...toggles, [eventKey]: value };
    setToggles(next);

    await setDoc(doc(firestore, 'users', userId), { eventToggles: next }, { merge: true });

    if (value === true) {
      const event = events.find((e) => e.internalId === eventKey);
      if (!event) return;

      const joinUrl = extractJoinUrl(event);
      if (!joinUrl) {
        console.warn('No join link found for event:', event);
        return;
      }

      const startRaw = event.start?.dateTime || event.start?.date;

      // Fire and forget; server should handle lead-time & idempotency
      const attendeeList =
        event.attendees
          ?.map((a) => a.email || a.displayName || '')
          .filter(Boolean) ?? [];

      await fetch('/api/recall/create-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId: event.internalId,
          joinUrl,
          startTime: startRaw,
          sourceEmail: event.sourceEmail,
          accountId: event.accountId,
          summary: event.summary,
          attendees: attendeeList,
        }),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <Loader2 className="animate-spin mr-2" /> Loading events…
      </div>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar size={22} /> Upcoming Events
      </h1>

      {events.length === 0 && (
        <p className="text-gray-600">No upcoming events found.</p>
      )}

      {errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2 items-start">
          <AlertTriangle size={16} className="mt-0.5" />
          <div>
            <p className="font-medium">Some calendars could not be synced:</p>
            <ul className="list-disc ml-5">
              {errors.map((err) => (
                <li key={err.accountId}>
                  {err.accountId}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {events.map((ev) => {
          const joinUrl = extractJoinUrl(ev);
          const platform = detectPlatform(joinUrl);

          const raw = ev.start?.dateTime || ev.start?.date;
          const start = raw ? new Date(raw).toLocaleString() : 'No date';

          return (
            <div
              key={ev.internalId}
              className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between"
            >
              <div>
                <h2 className="font-medium text-lg">{ev.summary}</h2>
                <p className="text-sm text-gray-600">{start}</p>
                {ev.sourceEmail && (
                  <p className="text-xs text-gray-400 mt-1">
                    {ev.sourceEmail}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-1">
                  {platform === 'zoom' && 'Zoom meeting'}
                  {platform === 'meet' && 'Google Meet'}
                  {platform === 'teams' && 'Microsoft Teams'}
                  {platform === 'unknown' && 'No conference link detected'}
                </p>

                {/* Show extracted link (debug) */}
                {joinUrl && (
                  <p className="text-xs text-blue-600 break-all mt-2">{joinUrl}</p>
                )}
              </div>

              <Switch
                checked={!!toggles[ev.internalId]}
                onCheckedChange={(v) => onToggle(ev.internalId, v)}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
