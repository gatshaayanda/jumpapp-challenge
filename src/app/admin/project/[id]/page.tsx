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
  getDocs,
  deleteDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firestore, storage } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

interface Message {
  text: string
  sender: string
  link?: string
  fileUrl?: string
  timestamp: any
}

export default function ViewProjectPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [project, setProject] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [optionalLink, setOptionalLink] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const isAdmin = true // This page is only for admin, so we allow delete

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const snap = await getDoc(doc(firestore, 'projects', id))
        if (!snap.exists()) throw new Error('Project not found.')
        setProject(snap.data())
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  useEffect(() => {
    const q = query(
      collection(firestore, 'projects', id, 'messages'),
      orderBy('timestamp', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(doc => doc.data() as Message))
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })

    return () => unsub()
  }, [id])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() && !file && !optionalLink.trim()) return

    const msg: any = {
      text: newMessage.trim(),
      sender: 'The Admin Hub Team',
      link: optionalLink.trim(),
      timestamp: serverTimestamp(),
    }

    if (file) {
      const storageRef = ref(storage, `messages/${id}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      msg.fileUrl = await getDownloadURL(snapshot.ref)
    }

    await addDoc(collection(firestore, 'projects', id, 'messages'), msg)
    setNewMessage('')
    setOptionalLink('')
    setFile(null)
  }

  async function handleDeleteAllMessages() {
    const confirmDelete = confirm('Are you sure you want to delete all messages?')
    if (!confirmDelete) return

    const q = collection(firestore, 'projects', id, 'messages')
    const snap = await getDocs(q)
    const deletions = snap.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletions)
  }

  if (loading) return <AdminHubLoader />
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>
  if (!project) return null

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 font-inter">
      <h1 className="text-3xl font-bold">Project Overview</h1>

      {/* 💬 Project Messages */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#0F264B]">💬 Project Messages</h2>
          {isAdmin && (
            <button
              onClick={handleDeleteAllMessages}
              className="text-sm text-red-600 border border-red-500 px-3 py-1 rounded hover:bg-red-50"
            >
              🗑️ Delete All
            </button>
          )}
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto border rounded p-4 bg-gray-50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-md shadow ${
                m.sender === 'The Admin Hub Team' ? 'bg-blue-100 ml-auto' : 'bg-white border'
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
              <span className="text-xs text-right block mt-1 text-gray-500">{m.sender}</span>
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
       
             {project.live_revisable_draft_link && (
          <div>
            <span className="font-semibold block">🚀 Live Draft:</span>
            <a
              href={project.live_revisable_draft_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline font-semibold"
            >
              View Live Site
            </a>
          </div>
        )}
                <Read label="Progress Update" value={project.progress_update} />
     
       
       {project.resource_link && (
          <div>
            <span className="font-semibold block">📎 Resource Link:</span>
            <a
              href={project.resource_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Open Shared File
            </a>
          </div>
        )}

  

                      <button
        onClick={() => router.push('/admin/project')}
        className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to Projects
      </button>
      <div className="space-y-3 text-sm">
        <Read label="Client Name" value={project.client_name} />
        <Read label="Client Email" value={project.client_email} />
        <Read label="Business" value={project.business} />
        <Read label="Industry" value={project.industry} />
        <Read label="Goals" value={project.goals} />
        <Read label="Pain Points" value={project.painpoints} />
        <Read label="Pages" value={project.pages} />
        <Read label="Content" value={project.content} />
        <Read label="Features" value={project.features} />
        <Read label="Design Preferences" value={project.design_prefs} />
        <Read label="Examples / Competitors" value={project.examples} />
        <Read label="Mood / Branding" value={project.mood} />
   <Read label="Admin Notes" value={project.admin_notes} />
        <Read label="Client Admin Panel Access" value={project.admin_panel ? 'Yes' : 'No'} />

       
      </div>


    </div>
  )
}

function Read({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="font-semibold">{label}:</span>{' '}
      <span className="text-gray-800">{value?.toString().trim() || '—'}</span>
    </div>
  )
}
