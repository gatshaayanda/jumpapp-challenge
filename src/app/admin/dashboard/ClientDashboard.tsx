'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Calendar, Settings, Users, Sparkles, Bot } from 'lucide-react'
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import LogoMkt from '@/components/LogoMkt' // keep your naming
import LogoMktMark from '@/components/LogoMktMark'
import UpcomingEventsWidget from '@/components/UpcomingEventsWidget'

export default function DashboardClient() {
  const router = useRouter()
  const auth = getAuth()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.replace('/login')
      setUser(u)
    })
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    document.cookie =
      'firebase_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    router.replace('/login')
  }

  const sections = [
    {
      title: 'Your Meetings',
      desc: 'View past meetings, transcripts & AI drafts.',
      icon: <Calendar size={22} />,
      href: '/meetings',
      color: 'bg-blue-600',
    },
    {
      title: 'Upcoming Events',
      desc: 'All future Google Calendar events across accounts.',
      icon: <Users size={22} />,
      href: '/events',
      color: 'bg-indigo-600',
    },
    {
      title: 'AI Automations',
      desc: 'Configure your content-generation automations.',
      icon: <Sparkles size={22} />,
      href: '/automations',
      color: 'bg-purple-600',
    },
    {
      title: 'Recall.ai Bots',
      desc: 'Manage note-taker bots joining your meetings.',
      icon: <Bot size={22} />,
      href: '/recall',
      color: 'bg-rose-600',
    },
    {
      title: 'Settings',
      desc: 'OAuth connections, posting accounts & bot timing.',
      icon: <Settings size={22} />,
      href: '/settings',
      color: 'bg-gray-800',
    },
  ]

  return (
    <main className="min-h-screen bg-white text-black px-6 py-10 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <LogoMktMark className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">
            MeetingPost AI
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:opacity-80 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </header>

      {/* Welcome */}
      <h1 className="text-xl font-semibold mb-6">
        Welcome back, {user?.displayName?.split(' ')[0] || 'Advisor'} 👋
      </h1>
{/* Upcoming Events Preview */}
<UpcomingEventsWidget />

      {/* Sections */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((s) => (
          <button
            key={s.title}
            onClick={() => router.push(s.href)}
            className={`p-6 rounded-xl text-left shadow-md hover:shadow-lg transition flex flex-col justify-between ${s.color} text-white`}
          >
            <div className="flex items-center gap-3 mb-3">
              {s.icon}
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <p className="text-sm opacity-90">{s.desc}</p>
          </button>
        ))}
      </section>
    </main>
  )
}
