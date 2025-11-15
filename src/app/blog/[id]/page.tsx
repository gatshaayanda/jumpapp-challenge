'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/utils/firebaseConfig';

interface Blog {
  title: string;
  body: string;
  created_at: { seconds: number; nanoseconds: number };
}

export default function BlogPostPage() {
  const router = useRouter();
  const path = usePathname();          // e.g. "/blog/abc123"
  const id = path.split('/').pop()!;   // "abc123"

  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, 'blogs', id));
        if (!snap.exists()) {
          router.replace('/blog');
          return;
        }
        setPost(snap.data() as Blog);
      } catch {
        router.replace('/blog');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) {
    return <p className="text-center py-20">Loading post…</p>;
  }
  if (!post) {
    return <p className="text-center py-20">Post not found.</p>;
  }

  return (
    <main className="min-h-screen py-20 px-6 bg-[#F1F1F1] text-[#0B1A33]">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => router.push('/blog')}
        >
          ← Back to Insights &amp; Updates
        </button>
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="text-gray-500 text-sm">
          {new Date(post.created_at.seconds * 1000).toLocaleDateString()}
        </p>
        <div className="prose max-w-none whitespace-pre-wrap">
          {post.body}
        </div>
      </div>
    </main>
  );
}
