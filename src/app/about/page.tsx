'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { firestore } from '@/utils/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type AboutImages = {
  heroUrl: string;
  storyUrl: string;
};

export default function AboutPage() {
  const [images, setImages] = useState<AboutImages>({ heroUrl: '', storyUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(firestore, 'about', 'images');
        const snap = await getDoc(ref);
        if (snap.exists()) setImages(snap.data() as AboutImages);
      } catch (err) {
        console.error('Error fetching About images:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main id="main" className="bg-[--background] text-[--foreground] overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[65vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Background */}
        {!loading && (
          <Image
            src={images.heroUrl || '/placeholder.png'}
            alt="Scents & Suites ambiance"
            fill
            className="absolute inset-0 object-cover opacity-40"
            priority
          />
        )}
        <div className="absolute inset-0 bg-[--brand-primary]/80 backdrop-blur-[1px]" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-[0.15em] text-[--brand-secondary] uppercase mb-4">
            About Scents & Suites
          </h1>
          <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto">
            Where elegance, fragrance, and comfort meet in Gaborone’s most serene
            luxury villa — an intimate retreat designed to slow time and awaken the senses.
          </p>
        </div>
      </section>

      {/* Story + Vision */}
      <section className="py-24 px-6 max-w-6xl mx-auto space-y-24 relative">
        {/* Our Story */}
        <div className="grid md:grid-cols-2 gap-12 items-center animate-fadeIn">
          <div className="space-y-4">
            <h2 className="text-3xl font-serif font-semibold text-[--brand-secondary] mb-2">
              Our Story
            </h2>
            <p className="text-[--brand-accent] leading-relaxed">
              Born from a passion for hospitality and fine living, Scents & Suites
              emerged as a private luxury villa offering an elegant stay in the
              heart of Village, Gaborone. Every corner is curated to balance
              aesthetic beauty with aromatic calm — where each suite tells a
              story, and every guest leaves with a lingering memory.
            </p>
            <p className="text-[--brand-accent]/90 leading-relaxed">
              From candlelit rooms to curated local experiences, we welcome
              discerning travellers, professionals, and couples seeking refined
              tranquility.
            </p>
          </div>

          <div className="w-full">
            {loading ? (
              <div className="w-full h-80 bg-gray-300/40 animate-pulse rounded-xl" />
            ) : (
              <Image
                src={images.storyUrl || '/placeholder.png'}
                alt="Scents & Suites exterior"
                width={600}
                height={400}
                className="rounded-xl shadow-lg object-cover w-full h-auto transition-transform duration-500 hover:scale-[1.02]"
              />
            )}
          </div>
        </div>

        {/* Vision & Values */}
        <div className="grid md:grid-cols-2 gap-12 items-start animate-fadeIn-slow">
          <div>
            <h3 className="text-2xl font-serif font-semibold text-[--brand-secondary] mb-3">
              Our Vision
            </h3>
            <p className="text-[--brand-accent] leading-relaxed">
              To become Gaborone’s signature destination for luxury, scent, and soulful rest —
              a place where every guest reconnects with peace and presence.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-serif font-semibold text-[--brand-secondary] mb-3">
              What We Value
            </h3>
            <ul className="list-disc list-inside text-[--brand-accent] space-y-2 leading-relaxed">
              <li>Warm, thoughtful hospitality in every interaction</li>
              <li>Design that feels both timeless and personal</li>
              <li>Signature aromas and soothing ambiance</li>
              <li>Quiet privacy in a prime central location</li>
              <li>Meaningful partnerships with local artisans</li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center animate-fadeIn-slower">
          <h4 className="text-2xl font-serif font-semibold text-[--brand-secondary] mb-4">
            Ready to experience luxury that lingers?
          </h4>
          <Link
            href="/room-styles"
            className="inline-block bg-[--brand-secondary] text-[--brand-primary] text-lg font-semibold px-6 py-3 rounded-full shadow-glow-gold hover:brightness-110 transition"
          >
            Explore Our Suites
          </Link>
        </div>
      </section>

      {/* Ambient Glow Accent */}
      <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-[--brand-primary]/60 to-transparent pointer-events-none" />

      {/* Animation + Glow Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        .animate-fadeIn-slow { animation: fadeIn 1.4s ease-out forwards; }
        .animate-fadeIn-slower { animation: fadeIn 1.8s ease-out forwards; }

        .shadow-glow-gold {
          box-shadow: 0 0 14px rgba(214,182,120,0.45);
        }
        .shadow-glow-gold:hover {
          box-shadow: 0 0 22px rgba(214,182,120,0.65);
        }
      `}</style>
    </main>
  );
}
