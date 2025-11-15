'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { sender: 'user' | 'bot'; text: string };

const STORAGE_KEY = 'mkt_chat_history_v1';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* Load/save chat history */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}

    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (!open && messages.length) setUnread((u) => u + 1);
    if (open) setUnread(0);
  }, [messages, open]);

  /* Welcome message */
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text:
            "Hi! I'm the MeetingPost Assistant.\nI can help with meeting transcripts, social post generation, and platform navigation.\nWhat would you like to do?",
        },
      ]);
      setSuggestions([
        'How does this tool work?',
        'Show me my meetings',
        'Generate social post examples',
        'Where are settings?',
      ]);
    }
  }, [open, messages.length]);

  const pushBot = (text: string, sugg?: string[]) => {
    setMessages((prev) => [...prev, { sender: 'bot', text }]);
    setSuggestions(sugg || []);
  };

  async function sendMessage(over?: string) {
    const text = (over ?? input).trim();
    if (!text) return;

    setMessages((p) => [...p, { sender: 'user', text }]);
    setInput('');
    setTyping(true);

    try {
      const res = await fetch('/api/fake-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const reply =
        data?.reply?.trim() ||
        "I'm not sure yet — but I can help with meetings, transcripts, or social posts.";
      pushBot(reply, data?.suggestions || []);
    } catch {
      pushBot("Hmm, something went wrong — try another question.");
    }

    setTyping(false);
  }

  const onSuggestion = (s: string) => sendMessage(s);

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:opacity-80 transition"
          aria-label="Open chat"
        >
          💬
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-xs px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 flex flex-col rounded-xl shadow-2xl border border-[--border] bg-white"
          style={{
            width: 'min(90vw, 22rem)',
            height: '28rem',
          }}
        >
          <div className="px-4 py-3 bg-black text-white flex items-center justify-between">
            <div className="font-semibold text-sm">MeetingPost Assistant</div>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:opacity-80"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-white">
            {messages.map((m, i) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-line ${
                      isUser
                        ? 'bg-black text-white'
                        : 'bg-[#f7f7f7] text-black border border-[--border]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-[#f7f7f7] border border-[--border] text-black">
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: '120ms' }} />
                  <span className="typing-dot" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="px-3 py-2 border-t border-[--border] bg-white flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestion(s)}
                  className="text-xs px-3 py-1 rounded-full border border-[--border] text-black hover:bg-black hover:text-white transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex p-3 border-t border-[--border] bg-white gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question…"
              className="flex-1 border border-[--border] rounded-full px-4 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={() => sendMessage()}
              className="px-4 py-2 bg-black text-white rounded-full text-sm hover:opacity-80"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        .typing-dot {
          display: inline-block;
          width: 6px; height: 6px;
          margin-right: 4px;
          background: #000;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}
