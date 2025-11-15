'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection,
  getDocs,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

export default function ClientDashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [messageAlerts, setMessageAlerts] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('role='))

    const email = cookie ? decodeURIComponent(cookie.split('=')[1]) : ''

    if (!email || !email.includes('@')) {
      router.replace('/client/login')
      return
    }

    const fetchProjects = async () => {
      try {
        const q = query(
          collection(firestore, 'projects'),
          where('client_email', '==', email)
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setProjects(data)

        // 🔔 Check for messages in each project
        const alerts: Record<string, boolean> = {}
        for (const doc of snap.docs) {
          const messagesCol = collection(firestore, 'projects', doc.id, 'messages')
          const countSnap = await getCountFromServer(messagesCol)
          alerts[doc.id] = countSnap.data().count > 0
        }
        setMessageAlerts(alerts)
      } catch (err) {
        console.error(err)
        setError('Error fetching projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [router])

  const handleLogout = () => {
    document.cookie = 'role=; path=/; max-age=0;'
    router.replace('/client/login')
  }

  if (loading) return <AdminHubLoader />
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <button
          onClick={handleLogout}
          className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200 text-sm font-medium"
        >
          Logout
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="italic text-gray-500">
          No projects yet. We'll notify you when one is assigned.
        </p>
      ) : (
        <ul className="space-y-4">
          {projects.map(p => (
            <li key={p.id} className="p-4 border rounded bg-white shadow">
              <h2 className="font-semibold">{p.business || p.client_name}</h2>
              <p className="text-sm text-gray-500">{p.industry}</p>
              <p><strong>Status:</strong> {p.progress_update || '—'}</p>
              {messageAlerts[p.id] && (
<p className="text-green-600 text-sm font-medium mt-1">
  📬 You have new messages from Admin Hub! Click "Open Project" below. 🙂
</p>

              )}
              <a
                href={`/client/project/${p.id}`}
                className="text-blue-600 underline mt-2 inline-block"
              >
                Open Project →
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
