'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'

export default function NewBlogPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await addDoc(collection(firestore, 'blogs'), {
        admin_id: 'admin',
        title,
        body,
        created_at: serverTimestamp(),
      })
      router.push('/admin/blog')
    } catch (e: any) {
      setErr(e.message)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Write New Blog Post</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save &amp; Publish
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>
        </div>

        {err && <p className="text-red-500">{err}</p>}
      </form>
    </div>
  )
}
