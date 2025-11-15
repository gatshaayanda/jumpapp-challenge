'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { firestore } from '@/utils/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

type DiningItem = {
  id: string;
  title: string;
  desc: string;
  imageUrl: string;
  price: string;
  order: number;
};

export default function DiningPage() {
  const [items, setItems] = useState<DiningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, 'dining'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          ...(doc.data() as DiningItem),
          id: doc.id,
        }));
        setItems(data);
      } catch (err) {
        console.error('Error fetching dining experiences:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="bg-[--background] text-[--foreground] px-6 py-24 relative overflow-hidden">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-20 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[--brand-secondary] tracking-[0.25em] uppercase mb-6">
          Dining at the Villa
        </h1>
        <p className="text-base md:text-lg text-[--brand-accent] leading-relaxed max-w-3xl mx-auto">
          Whether you’re staying in for a serene evening or celebrating a special
          moment, our dining captures the essence of indulgence — warm ambiance,
          refined taste, and the familiar comfort of home-cooked excellence.
        </p>
      </div>

      {/* Dining Experiences */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-300/40 rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="group bg-white/95 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-transform duration-300 hover:-translate-y-1 relative"
              >
                {/* Image with overlay */}
                <div className="relative">
                  <Image
                    src={item.imageUrl || '/placeholder.png'}
                    alt={item.title}
                    width={500}
                    height={320}
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-0 group-hover:opacity-100 transition" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-[--brand-primary] mb-2 tracking-wide">
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{item.desc}</p>
                  {item.price && (
                    <p className="text-sm font-medium text-[--brand-secondary] tracking-wide">
                      {item.price}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center text-gray-500 italic py-10">
              No dining experiences available yet. Please check back soon.
            </div>
          )}
        </div>
      )}

      {/* Background texture glow for ambiance */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,#4C1F26_0%,transparent_70%)] opacity-10"></div>

      {/* Subtle animation + glow styling */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }

        .shadow-gold {
          box-shadow: 0 0 12px rgba(214,182,120,0.4);
        }
        .shadow-gold:hover {
          box-shadow: 0 0 18px rgba(214,182,120,0.6);
        }
      `}</style>
    </main>
  );
}
