'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

export default function BlogListPage() {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDocs(
          query(collection(firestore, 'blogs'), where('admin_id', '==', 'admin'))
        )
        setPosts(snap.docs.map(d => ({ id: d.id, title: d.data().title })))
      } catch (err) {
        console.error('Failed to load blog posts', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <AdminHubLoader />

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:underline">
        ← Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Link
          href="/admin/blog/new"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="italic text-gray-500">No posts yet.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map(p => (
            <li key={p.id} className="flex justify-between border-b pb-2">
              <span>{p.title}</span>
              <div className="space-x-2">
                <Link
                  href={`/admin/blog/${p.id}/edit`}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/blog/${p.id}`}
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
