'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent } from 'react'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const id = params.id!

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      router.replace('/admin/blog')
      return
    }

    ;(async () => {
      try {
        const snap = await getDoc(doc(firestore, 'blogs', id))
        if (!snap.exists()) throw new Error('Post not found.')
        const data = snap.data() as any
        setTitle(data.title)
        setBody(data.body)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, router])

  if (loading) return <AdminHubLoader />

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await updateDoc(doc(firestore, 'blogs', id), { title, body })
      router.push('/admin/blog')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await deleteDoc(doc(firestore, 'blogs', id))
      router.push('/admin/blog')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Edit Blog Post</h1>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Body"
          required
          className="w-full border px-3 py-2 rounded h-40"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Update
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
