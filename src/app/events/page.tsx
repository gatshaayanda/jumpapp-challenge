'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firestore } from '@/utils/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Calendar, Loader2 } from 'lucide-react';

type GEvent = {
  id: string;
  summary: string;
  start: { dateTime: string };
  hangoutLink?: string;
  conferenceData?: any;
};

export default function EventsPage() {
  const [events, setEvents] = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  // PLATFORM DETECTION
  const getPlatform = (e: GEvent) => {
    const link =
      e.hangoutLink ||
      e.conferenceData?.entryPoints?.[0]?.uri ||
      '';

    if (link.includes('zoom')) return 'zoom';
    if (link.includes('google')) return 'meet';
    if (link.includes('teams')) return 'teams';
    return 'unknown';
  };

  // LOAD USER + EVENTS
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      setUserId(u.uid);

      try {
        // Load Google Calendar events
        const res = await fetch('/api/google/events');
        const json = await res.json();
        setEvents(json.events || []);

        // Load toggle states
        const userDoc = await getDoc(doc(firestore, 'users', u.uid));
        if (userDoc.exists()) {
          setToggles(userDoc.data().eventToggles || {});
        }
      } catch (e) {
        console.error('Error loading events:', e);
      }

      setLoading(false);
    });
  }, []);

  // HANDLE TOGGLE
  const onToggle = async (eventId: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [eventId]: value }));
    if (!userId) return;

    // Save toggle in Firestore
    await setDoc(
      doc(firestore, 'users', userId),
      { eventToggles: { ...toggles, [eventId]: value } },
      { merge: true }
    );

    // ---- RECALL.AI BOT CREATION ----
    if (value === true) {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      const platformLink =
        event.hangoutLink ||
        event.conferenceData?.entryPoints?.[0]?.uri ||
        '';

      if (!platformLink) {
        console.warn('No join link found for event', eventId);
        return;
      }

      // Call backend to create Recall AI bot
      await fetch('/api/recall/create-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userId,
          eventId,
          joinUrl: platformLink,
          startTime: new Date(event.start.dateTime).getTime(),
        }),
      });
    }
  };

  // RENDER
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

      <div className="space-y-4">
        {events.map((ev) => {
          const platform = getPlatform(ev);
          const start = new Date(ev.start.dateTime).toLocaleString();

          return (
            <div
              key={ev.id}
              className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between"
            >
              <div>
                <h2 className="font-medium text-lg">{ev.summary}</h2>
                <p className="text-sm text-gray-600">{start}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {platform === 'zoom' && 'Zoom meeting'}
                  {platform === 'meet' && 'Google Meet'}
                  {platform === 'teams' && 'Microsoft Teams'}
                  {platform === 'unknown' && 'No conference link detected'}
                </p>
              </div>

              <Switch
                checked={!!toggles[ev.id]}
                onCheckedChange={(v) => onToggle(ev.id, v)}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
