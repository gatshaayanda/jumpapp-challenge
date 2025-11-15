'use client';

import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/utils/firebaseConfig';
import { uploadFiles } from '@/utils/uploadthing';

/** Keep this local so it doesn't depend on external types */
type ChatMessage = {
  id?: string;
  text: string;
  sender: string;          // 'MKT Corporate Team' or client's name
  link?: string;
  fileUrl?: string;
  timestamp: any;
};

export default function ChatPanel({
  projectId,
  senderName,
  canDeleteAll = false,
  brand = { primary: '#0A1C3D', accent: '#D4AF37' }, // MKT navy + gold
}: {
  projectId: string;
  senderName: string;
  canDeleteAll?: boolean;
  brand?: { primary: string; accent: string };
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [optionalLink, setOptionalLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId) return;
    const q = query(
      collection(firestore, 'projects', projectId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }));
      setMessages(rows);
      // gentle autoscroll
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    });
    return () => unsub();
  }, [projectId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() && !file && !optionalLink.trim()) return;

    setBusy(true);
    const msg: ChatMessage = {
      text: newMessage.trim(),
      sender: senderName || 'User',
      link: optionalLink.trim() || undefined,
      fileUrl: undefined,
      timestamp: serverTimestamp(),
    };

    try {
      if (file) {
        const res = await uploadFiles('fileUploader', { files: [file] });
        const url = res?.[0]?.url;
        if (!url) throw new Error('Upload failed');
        msg.fileUrl = url;
      }
      await addDoc(collection(firestore, 'projects', projectId, 'messages'), msg as any);
      setNewMessage('');
      setOptionalLink('');
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to send');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    if (!canDeleteAll) return;
    if (!confirm('Delete all messages in this project?')) return;
    const snap = await getDocs(collection(firestore, 'projects', projectId, 'messages'));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  }

  const isOwn = (m: ChatMessage) => m.sender === senderName;

  return (
    <section className="rounded-2xl border bg-white overflow-hidden"
      style={{ borderColor: 'rgba(0,0,0,.08)' }}>
      {/* Header */}
      <div
        className="px-4 md:px-6 py-3 flex items-center justify-between"
        style={{
          background:
            `linear-gradient(180deg, ${brand.primary} 0%, ${brand.primary}CC 100%)`,
          color: '#fff'
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            💬
          </span>
          <h2 className="text-sm md:text-base font-semibold tracking-wide">
            Project Messages
          </h2>
        </div>
        {canDeleteAll && (
          <button
            onClick={deleteAll}
            className="text-xs md:text-sm rounded px-3 py-1 border"
            style={{ borderColor: 'rgba(255,255,255,0.35)', background: 'transparent', color: '#fff' }}
            title="Delete all messages"
          >
            🗑️ Delete All
          </button>
        )}
      </div>

      {/* Stream */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto border-x border-b p-3 md:p-4 bg-gray-50"
           style={{ borderColor: 'rgba(0,0,0,.06)' }}>
        {messages.map(m => (
          <div key={m.id}
               className={`max-w-[85%] rounded-2xl shadow-sm px-4 py-3 ${
                 isOwn(m)
                   ? 'ml-auto'
                   : ''
               }`}
               style={{
                 background: isOwn(m) ? '#F6F7FB' : '#fff',
                 border: `1px solid ${isOwn(m) ? '#E5E7EB' : 'rgba(0,0,0,.08)'}`,
               }}>
            {/* sender chip */}
            <div className="text-[10px] font-semibold mb-1"
                 style={{ color: isOwn(m) ? brand.primary : '#6B7280' }}>
              {m.sender}
            </div>
            {/* text */}
            {!!m.text && (
              <p className="text-sm text-gray-800 whitespace-pre-line leading-6">{m.text}</p>
            )}
            {/* link/file */}
            <div className="mt-2 space-y-1">
              {m.link && (
                <a href={m.link} target="_blank" rel="noopener noreferrer"
                   className="text-xs underline"
                   style={{ color: brand.primary }}>
                  🔗 Reference link
                </a>
              )}
              {m.fileUrl && (
                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                   className="text-xs underline"
                   style={{ color: brand.primary }}>
                  📎 View attached file
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="p-3 md:p-4 space-y-2 bg-white">
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type your message…"
          rows={3}
          className="w-full border p-3 rounded-lg text-sm"
          style={{ borderColor: 'rgba(0,0,0,.12)' }}
        />
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="block text-xs text-gray-600"
          />
          <input
            type="url"
            value={optionalLink}
            onChange={e => setOptionalLink(e.target.value)}
            placeholder="Optional link"
            className="flex-1 border p-2 rounded-lg text-sm w-full"
            style={{ borderColor: 'rgba(0,0,0,.12)' }}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: brand.accent, color: brand.primary, boxShadow: '0 1px 0 rgba(0,0,0,.05)' }}
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
}
