'use client';

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

type Event = {
  id: string;
  summary?: string;
  start?: { dateTime?: string };
  hangoutLink?: string;
};

export default function UpcomingEventsWidget() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/google/events");
        const data = await res.json();
        setEvents(data.events?.slice(0, 5) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold">Upcoming Meetings</h2>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading events…</p>}

      {!loading && events.length === 0 && (
        <p className="text-sm text-gray-500">
          No upcoming calendar events found.
        </p>
      )}

      <ul className="space-y-3">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="p-3 bg-white rounded-lg border text-sm shadow-sm"
          >
            <div className="font-medium">{ev.summary || "Untitled Event"}</div>
            <div className="text-gray-500">
              {ev.start?.dateTime
                ? new Date(ev.start.dateTime).toLocaleString()
                : "No date"}
            </div>

            {ev.hangoutLink && (
              <div className="text-xs mt-1 text-blue-600 underline">
                {ev.hangoutLink}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
