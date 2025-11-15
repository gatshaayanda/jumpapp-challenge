'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Loader2,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/utils/firebaseConfig';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      await addDoc(collection(firestore, 'contact_messages'), {
        admin_id: 'admin',
        name: data.get('name') || '',
        email: data.get('email') || '',
        phone: data.get('phone') || '',
        message: data.get('message') || '',
        interest: data.get('interest') || 'General',
        status: 'new',
        source: 'scents-suites-contact',
        createdAt: serverTimestamp(),
      });
      form.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="bg-[--background] text-[--foreground] px-6 py-24 relative overflow-hidden">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-16 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[--brand-secondary] tracking-[0.25em] uppercase mb-6">
          Contact Us
        </h1>
        <p className="text-base md:text-lg text-[--brand-accent] leading-relaxed max-w-2xl mx-auto">
          We’d love to hear from you. Whether you’re planning a stay, exploring
          partnerships, or simply curious — our team is always a message away.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto animate-fadeIn-slow">
        {/* LEFT: Contact Info */}
        <div className="space-y-5 text-sm text-[--brand-accent]">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-[--brand-secondary]" />
            <div>
              <p className="font-medium text-[--brand-secondary]">Village, Gaborone</p>
              <a
                href="https://www.google.com/maps?q=Village,+Gaborone"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[--brand-secondary]"
              >
                Get Directions
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone size={20} className="text-[--brand-secondary]" />
            <div className="space-y-1">
              <a href="tel:+26772199926" className="underline block hover:text-[--brand-secondary]">
                +267 72 199 926
              </a>
              <a href="tel:+26773931344" className="underline block hover:text-[--brand-secondary]">
                +267 73 931 344
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageCircle size={20} className="text-[--brand-secondary]" />
            <div className="space-y-1">
              <a
                href="https://wa.me/26772199926"
                target="_blank"
                rel="noopener noreferrer"
                className="underline block hover:text-[--brand-secondary]"
              >
                WhatsApp: 72 199 926
              </a>
              <a
                href="https://wa.me/26773931344"
                target="_blank"
                rel="noopener noreferrer"
                className="underline block hover:text-[--brand-secondary]"
              >
                WhatsApp: 73 931 344
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail size={20} className="text-[--brand-secondary]" />
            <a
              href="mailto:tumoratheedi@gmail.com"
              className="underline hover:text-[--brand-secondary]"
            >
              tumoratheedi@gmail.com
            </a>
          </div>

          <div className="flex items-start gap-3">
            <FileText size={20} className="text-[--brand-secondary]" />
            <a
              href="/company-profile.pdf"
              className="underline hover:text-[--brand-secondary]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Company Profile
            </a>
          </div>
        </div>

        {/* RIGHT: Contact Form */}
        <form
          onSubmit={onSubmit}
          className="space-y-5 bg-white/90 rounded-2xl p-6 shadow-md border border-[--brand-secondary]/20"
        >
          <Field label="Full Name" id="name" required />
          <Field label="Email" id="email" type="email" required />
          <Field label="Phone" id="phone" />
          <div>
            <label
              htmlFor="interest"
              className="text-sm font-medium text-black"
            >
              Interested In
            </label>
            <select
              id="interest"
              name="interest"
              className="w-full mt-1 px-3 py-2 border rounded text-sm bg-white text-black focus:ring-2 focus:ring-[--brand-secondary]/40 focus:outline-none"
            >
              <option>Booking Inquiry</option>
              <option>Partnership</option>
              <option>Feedback</option>
              <option>General</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="message"
              className="text-sm font-medium text-black"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              className="w-full mt-1 px-3 py-2 border rounded text-sm bg-white text-black focus:ring-2 focus:ring-[--brand-secondary]/40 focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-medium text-[--brand-primary] bg-[--brand-secondary] hover:brightness-110 transition shadow-glow-gold"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {status === 'sending' ? 'Sending…' : 'Send Message'}
          </button>

          {status === 'sent' && (
            <p className="text-green-600 text-sm mt-2">
              ✅ Thank you — your message has been received.
            </p>
          )}
          {status === 'error' && (
            <p className="text-red-600 text-sm mt-2">
              ❌ Could not send. Please try again or contact us directly via WhatsApp.
            </p>
          )}
        </form>
      </div>

      {/* Ambient Glow */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-[--brand-primary]/60 to-transparent pointer-events-none" />

      {/* Animations & Glow */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fadeIn-slow {
          animation: fadeIn 1.4s ease-out forwards;
        }
        .shadow-glow-gold {
          box-shadow: 0 0 14px rgba(214, 182, 120, 0.45);
        }
        .shadow-glow-gold:hover {
          box-shadow: 0 0 22px rgba(214, 182, 120, 0.65);
        }
      `}</style>
    </main>
  );
}

/* Helper field */
function Field({
  label,
  id,
  type = 'text',
  required,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-black">
        {label}
        {required && ' *'}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={label}
        className="w-full mt-1 px-3 py-2 border rounded text-sm bg-white text-black focus:ring-2 focus:ring-[--brand-secondary]/40 focus:outline-none"
      />
    </div>
  );
}
