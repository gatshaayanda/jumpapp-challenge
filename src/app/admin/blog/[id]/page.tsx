'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

export default function AdminViewBlogPage() {
  const path = usePathname().split('/')
  const id = path[path.indexOf('blog') + 1]  // dynamic segment

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<{ title: string; body: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDoc(doc(firestore, 'blogs', id))
        if (!snap.exists()) {
          setError('Post not found.')
        } else {
          setPost(snap.data() as any)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <AdminHubLoader />
  if (error)   return <p className="p-8 text-red-500">{error}</p>
  if (!post)   return <p className="p-8">Post not found.</p>

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <Link
        href="/admin/blog"
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to Posts
      </Link>
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="whitespace-pre-wrap">{post.body}</div>
      <Link
        href={`/admin/blog/${id}/edit`}
        className="text-blue-500 hover:underline"
      >
        ✎ Edit this post
      </Link>
    </div>
  )
}
