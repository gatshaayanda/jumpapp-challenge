'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { firestore } from '@/utils/firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  desc: string;
  order: number;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, 'shop'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          ...(doc.data() as Product),
          id: doc.id,
        }));
        setProducts(data);
      } catch (err) {
        console.error('Error fetching shop products:', err);
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
          Scents I Love
        </h1>
        <p className="text-base md:text-lg text-[--brand-accent] leading-relaxed max-w-2xl mx-auto">
          Our signature scent collection captures the soul of Scents & Suites —
          elegant, warm, and timeless. Each fragrance is designed to bring home
          the serenity and sophistication of your stay.
        </p>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-300/40 rounded-2xl h-96 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {products.length > 0 ? (
            products.map((item) => (
              <div
                key={item.id}
                className="group bg-white/95 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-transform duration-300 hover:-translate-y-1 relative"
              >
                <div className="relative">
                  <Image
                    src={item.imageUrl || '/placeholder.png'}
                    alt={item.name}
                    width={500}
                    height={320}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000]/40 via-transparent opacity-0 group-hover:opacity-100 transition" />
                </div>

                <div className="p-5 flex flex-col flex-grow text-left">
                  <h2 className="text-xl font-semibold text-[--brand-primary] mb-1">
                    {item.name}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">{item.price}</p>
                  <p className="text-sm text-gray-700 leading-relaxed flex-grow mb-4">
                    {item.desc}
                  </p>

                  <Link
                    href="/contact"
                    className="text-[--brand-secondary] font-medium hover:underline mt-auto"
                  >
                    Enquire to Purchase →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500 italic py-10">
              No products available yet. Please check back soon.
            </div>
          )}
        </div>
      )}

      {/* Page motion & glow styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }

        @keyframes pulseSoft {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 6px rgba(184,155,89,0.45));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 12px rgba(214,182,120,0.8));
          }
        }
        .gold-pulse {
          animation: pulseSoft 4.5s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </main>
  );
}
