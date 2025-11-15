// src/app/blog/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { firestore } from '@/utils/firebaseConfig';

// Define the shape of a blog post
interface Blog {
  id: string;
  title: string;
  created_at: { seconds: number; nanoseconds: number };
}

export default function BlogPage() {
  const [posts, setPosts]   = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch all blogs in descending order of creation
      const snap = await getDocs(
        query(
          collection(firestore, 'blogs'),
          orderBy('created_at', 'desc')
        )
      );
      setPosts(
        snap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Blog, 'id'>)
        }))
      );
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <p className="text-center py-20">Loading posts…</p>;
  }

  return (
    <main className="min-h-screen py-20 px-6 bg-[#F1F1F1] text-[#0B1A33]">
           <section className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold">📰 Insights & Updates</h1>
        <p className="text-[#4F5F7A]">
          From product releases to case studies, this is where we share our thoughts, updates, and learnings.
        </p>

      </section>
      <section className="max-w-3xl mx-auto space-y-6">
        {posts.length === 0 ? (
          <p className="italic text-center text-[#4F5F7A]">No posts currently..</p>
        ) : (
          <ul className="space-y-8">
            {posts.map(post => (
              <li key={post.id} className="bg-white p-6 rounded shadow">
                <Link
                  href={`/blog/${post.id}`}
                  className="text-2xl font-semibold text-blue-600 hover:underline"
                >
                  {post.title}
                </Link>
                <p className="mt-2 text-sm text-[#4F5F7A]">
                  {new Date(post.created_at.seconds * 1000).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
