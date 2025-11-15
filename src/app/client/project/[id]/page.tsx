'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firestore, storage } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

interface Project {
  id: string
  client_name: string
  business: string
  industry: string
  goals: string
  painpoints: string
  pages: string
  content: string
  features: string
  admin_panel: boolean
  design_prefs: string
  examples: string
  mood: string
  progress_update: string
  resource_link?: string
  live_revisable_draft_link?: string
}

interface Message {
  id: string
  text: string
  sender: string
  link?: string
  fileUrl?: string
  timestamp: any
}

export default function ClientProjectDetails() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [optionalLink, setOptionalLink] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const email = (() => {
    try {
      return decodeURIComponent(
        document.cookie.split('; ').find(row => row.startsWith('role='))?.split('=')[1] || ''
      )
    } catch {
      return ''
    }
  })()

  useEffect(() => {
    if (!email || !email.includes('@')) {
      router.replace('/client/login')
      return
    }

    const fetchProject = async () => {
      try {
        const ref = doc(firestore, 'projects', id as string)
        const snap = await getDoc(ref)
        if (!snap.exists()) throw new Error('Project not found.')
        const data = snap.data()
        if (data.client_email !== email) throw new Error('Unauthorized to view this project.')
        setProject({ id: snap.id, ...data } as Project)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id, router, email])

  useEffect(() => {
    if (!id) return
    const q = query(
      collection(firestore, 'projects', id as string, 'messages'),
      orderBy('timestamp', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(
        snap.docs.map(doc => ({ ...(doc.data() as Omit<Message, 'id'>), id: doc.id }))
      )
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })

    return () => unsub()
  }, [id])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() && !file && !optionalLink.trim()) return
    const msg: any = {
      text: newMessage.trim(),
      sender: project?.client_name || 'Client',
      link: optionalLink.trim(),
      timestamp: serverTimestamp(),
    }

    if (file) {
      const storageRef = ref(storage, `messages/${id}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      msg.fileUrl = url
    }

    await addDoc(collection(firestore, 'projects', id as string, 'messages'), msg)
    setNewMessage('')
    setOptionalLink('')
    setFile(null)
  }

  if (loading) return <AdminHubLoader />
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>
  if (!project) return null

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 font-inter">
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#0F264B] mb-4">💬 Project Messages</h2>
        <div className="space-y-4 max-h-[400px] overflow-y-auto border rounded p-4 bg-gray-50">
          {messages.map((m, i) => (
            <div
              key={m.id}
              className={`p-3 rounded-lg max-w-md shadow ${
                m.sender === project.client_name ? 'bg-white border' : 'bg-blue-100 ml-auto'
              }`}
            >
              <p className="text-sm text-gray-800 whitespace-pre-line">{m.text}</p>
              {m.link && (
                <a
                  href={m.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline text-xs block mt-1"
                >
                  🔗 View Reference
                </a>
              )}
              {m.fileUrl && (
                <a
                  href={m.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline text-xs block mt-1"
                >
                  📎 View Uploaded File
                </a>
              )}
              <span className="text-xs text-right block mt-1 text-gray-500">
                {m.sender}
              </span>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-6 space-y-3">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            rows={3}
            className="w-full border p-3 rounded"
          />
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="block text-sm text-gray-500"
          />
          <input
            type="url"
            value={optionalLink}
            onChange={e => setOptionalLink(e.target.value)}
            placeholder="Optional link"
            className="w-full border p-2 rounded text-sm"
          />
          <button
            type="submit"
            className="bg-[#0F264B] text-white px-5 py-2 rounded hover:brightness-110"
          >
            📤 Send Message
          </button>
        </form>
      </div>

      {/* Intake Info */}
      <h2 className="text-xl font-bold text-[#0F264B] mb-4">📋 Preliminary Intake Info</h2>
      <div className="border p-6 rounded-2xl shadow-xl bg-white space-y-4">
        {project.live_revisable_draft_link && (
          <div>
            <span className="font-semibold text-blue-700 block mb-1">Live Project Link:</span>
            <a
              href={project.live_revisable_draft_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 font-bold underline text-lg"
            >
              🚀 Open Site/App
            </a>
          </div>
        )}

        <div>
          <span className="font-semibold text-blue-700 block mb-1">Progress Update:</span>
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4 text-blue-900 text-base font-medium shadow-inner min-h-[44px]">
            {project.progress_update?.trim() || (
              <span className="text-gray-400">No updates yet.</span>
            )}
          </div>
        </div>

        {project.resource_link && (
          <div>
            <span className="font-semibold text-gray-700 block mb-1">Shared Resource Link:</span>
            <a
              href={project.resource_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              📄 Open Document
            </a>
          </div>
        )}

     {/* ✅ Back to Dashboard Button */}
      <button
        onClick={() => router.push('/client/dashboard')}
        className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to Dashboard
      </button>
        <ReadLine label="Business" value={project.business} />
        <ReadLine label="Industry" value={project.industry} />
        <ReadLine label="Goals" value={project.goals} />
        <ReadLine label="Pain Points" value={project.painpoints} />
        <ReadLine label="Pages" value={project.pages} />
        <ReadLine label="Content" value={project.content} />
        <ReadLine label="Features" value={project.features} />
        <ReadLine label="Admin Panel Access" value={project.admin_panel ? 'Yes' : 'No'} />
        <ReadLine label="Design Preferences" value={project.design_prefs} />
        <ReadLine label="Examples / Competitor Sites" value={project.examples} />
        <ReadLine label="Mood / Branding" value={project.mood} />
      </div>

 
    </div>
  )
}

function ReadLine({ label, value }: { label: string; value: string | boolean }) {
  return (
    <div className="text-sm">
      <span className="block font-semibold text-gray-700">{label}:</span>
      <span className="text-gray-800">
        {value?.toString().trim() || <span className="text-gray-400">—</span>}
      </span>
    </div>
  )
}
