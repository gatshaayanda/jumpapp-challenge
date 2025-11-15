'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

interface Project {
  id: string
  name: string
  hasClientMessages: boolean
}

export default function ProjectListPage() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const fetchProjectsAndMessages = async () => {
      try {
        const snap = await getDocs(
          query(collection(firestore, 'projects'), where('admin_id', '==', 'admin'))
        )

        const projectsWithMessages: Project[] = await Promise.all(
          snap.docs.map(async docSnap => {
            const projectId = docSnap.id
            const name =
              docSnap.data().client_name || docSnap.data().business || 'Untitled Project'

            // Check if at least one message exists from client
            const messagesSnap = await getDocs(
              query(
                collection(firestore, 'projects', projectId, 'messages'),
                orderBy('timestamp', 'desc'),
                limit(10)
              )
            )

            const hasClientMessages = messagesSnap.docs.some(
              msg => msg.data().sender !== 'The Admin Hub Team'
            )

            return {
              id: projectId,
              name,
              hasClientMessages,
            }
          })
        )

        setProjects(projectsWithMessages)
      } catch (err) {
        console.error('Failed to load projects', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectsAndMessages()
  }, [])

  if (loading) return <AdminHubLoader />

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <Link
        href="/admin/dashboard"
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Link
          href="/admin/project/create-project"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="italic text-gray-500">No projects yet.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map(p => (
            <li key={p.id} className="flex justify-between border-b pb-2">
              <span>
                {p.name}
                {p.hasClientMessages && (
                  <span className="ml-2 text-green-600 font-medium text-sm">📬 New Messages</span>
                )}
              </span>
              <div className="space-x-2">
                <Link
                  href={`/admin/project/${p.id}/edit`}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/project/${p.id}`}
                  className="text-gray-500 hover:underline"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
