'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, ToggleLeft, ToggleRight, Video } from 'lucide-react'
import Image from 'next/image'
import { firestore } from '@/utils/firebaseConfig'
import { doc, setDoc, getDoc } from 'firebase/firestore'

type EventItem = {
  id: string
  start: string
  summary: string
  meetUrl?: string
  accountEmail: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})

  // Fetch events + preferences
  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      // 1️⃣ Load events from server (Google Calendar)
      const res = await fetch('/api/google/events')
      const json = await res.json()

      if (json.error) {
        console.error(json.error)
        return
      }

      setEvents(json.events || [])

      // 2️⃣ Load meeting toggle states from Firestore
      const prefDoc = await getDoc(doc(firestore, 'notetaker_prefs', 'default'))
      setPrefs(prefDoc.data() || {})
    } finally {
      setLoading(false)
    }
  }

  async function toggle(id: string) {
    const newState = !prefs[id]

    // Update local first for instant feedback
    setPrefs((prev) => ({ ...prev, [id]: newState }))

    // Write to Firestore (simple key:value map)
    await setDoc(doc(firestore, 'notetaker_prefs', 'default'), {
      ...prefs,
      [id]: newState,
    })
  }

  if (loading) {
    return (
      <main className="p-10 text-center text-gray-500">
        Loading your events…
      </main>
    )
  }

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <CalendarClock /> Upcoming Events
      </h1>

      {events.length === 0 && (
        <p className="text-gray-500 mt-6">No upcoming events found.</p>
      )}

      <div className="space-y-4">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="border rounded-xl p-5 shadow-sm bg-white flex flex-col sm:flex-row sm:items-center justify-between"
          >
            <div>
              <div className="text-lg font-semibold">{ev.summary}</div>

              <div className="text-sm text-gray-600 mt-1">
                {new Date(ev.start).toLocaleString()}
              </div>

              <div className="text-sm text-gray-500 mt-1">
                {ev.accountEmail}
              </div>

              {ev.meetUrl && (
                <div className="flex items-center gap-2 text-sm mt-2 text-blue-600">
                  <Video size={16} />
                  <a
                    href={ev.meetUrl}
                    target="_blank"
                    className="underline"
                    rel="noopener noreferrer"
                  >
                    Join Link
                  </a>
                </div>
              )}
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggle(ev.id)}
              className="mt-4 sm:mt-0 flex items-center gap-2"
            >
              {prefs[ev.id] ? (
                <>
                  <ToggleRight className="text-green-600" size={32} />
                  <span className="text-green-700 font-medium">
                    Notetaker enabled
                  </span>
                </>
              ) : (
                <>
                  <ToggleLeft className="text-gray-400" size={32} />
                  <span className="text-gray-500">Enable notetaker</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
