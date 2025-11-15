'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firestore } from '@/utils/firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { Plus, Trash2, Save, Sparkles } from 'lucide-react';

type AutoItem = {
  id: string;
  name: string;
  platform: 'linkedin' | 'facebook';
  prompt: string;
};

export default function AutomationsPage() {
  const auth = getAuth();

  const [uid, setUid] = useState<string>('');
  const [list, setList] = useState<AutoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New automation form
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'linkedin' | 'facebook'>('linkedin');
  const [prompt, setPrompt] = useState('');

  // Load user + automations
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUid(u.uid);
      loadAutomations(u.uid);
    });
  }, []);

  async function loadAutomations(uid: string) {
    setLoading(true);
    try {
      const q = query(
        collection(firestore, 'automations'),
        where('uid', '==', uid)
      );
      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as AutoItem[];

      setList(data);
    } catch (err) {
      console.error('Error loading automations:', err);
    }
    setLoading(false);
  }

  async function createAutomation() {
    if (!name.trim() || !prompt.trim()) return;
    setSaving(true);

    try {
      await addDoc(collection(firestore, 'automations'), {
        uid,
        name,
        platform,
        prompt,
        createdAt: Date.now(),
      });

      setName('');
      setPrompt('');
      setPlatform('linkedin');
      loadAutomations(uid);
    } catch (err) {
      console.error(err);
    }

    setSaving(false);
  }

  async function saveItem(item: AutoItem) {
    setSaving(true);
    try {
      const ref = doc(firestore, 'automations', item.id);
      await updateDoc(ref, {
        name: item.name,
        platform: item.platform,
        prompt: item.prompt,
      });
      loadAutomations(uid);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function removeItem(id: string) {
    if (!confirm('Delete this automation?')) return;

    try {
      await deleteDoc(doc(firestore, 'automations', id));
      loadAutomations(uid);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black p-6 font-sans">
      <header className="flex items-center gap-3 mb-8">
        <Sparkles size={24} />
        <h1 className="text-2xl font-bold">AI Automations</h1>
      </header>

      {/* CREATE NEW */}
      <section className="mb-10 max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">Create New Automation</h2>

        <input
          className="w-full border border-gray-300 px-3 py-2 rounded text-black"
          placeholder="Automation Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="w-full border border-gray-300 px-3 py-2 rounded text-black"
          value={platform}
          onChange={(e) =>
            setPlatform(e.target.value as 'linkedin' | 'facebook')
          }
        >
          <option value="linkedin">LinkedIn</option>
          <option value="facebook">Facebook</option>
        </select>

        <textarea
          className="w-full border border-gray-300 px-3 py-2 rounded text-black"
          rows={4}
          placeholder="Describe how you want the AI post to be generated"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          disabled={saving}
          onClick={createAutomation}
          className="bg-black text-white px-4 py-2 rounded hover:opacity-80 flex items-center gap-2"
        >
          <Plus size={18} />
          {saving ? 'Saving…' : 'Add Automation'}
        </button>
      </section>

      {/* LIST */}
      <section className="space-y-6 max-w-2xl">
        <h2 className="text-lg font-semibold">Your Automations</h2>

        {loading && <p className="text-gray-600">Loading…</p>}

        {list.length === 0 && !loading && (
          <p className="text-gray-500">No automations created yet.</p>
        )}

        {list.map((item) => (
          <AutomationItem
            key={item.id}
            item={item}
            onSave={saveItem}
            onDelete={removeItem}
          />
        ))}
      </section>
    </main>
  );
}

function AutomationItem({
  item,
  onSave,
  onDelete,
}: {
  item: AutoItem;
  onSave: (i: AutoItem) => void;
  onDelete: (id: string) => void;
}) {
  const [edit, setEdit] = useState(item);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
      <input
        className="w-full border border-gray-300 px-3 py-2 rounded text-black"
        value={edit.name}
        onChange={(e) => setEdit({ ...edit, name: e.target.value })}
      />

      <select
        className="w-full border border-gray-300 px-3 py-2 rounded text-black"
        value={edit.platform}
        onChange={(e) =>
          setEdit({ ...edit, platform: e.target.value as 'linkedin' | 'facebook' })
        }
      >
        <option value="linkedin">LinkedIn</option>
        <option value="facebook">Facebook</option>
      </select>

      <textarea
        className="w-full border border-gray-300 px-3 py-2 rounded text-black"
        rows={4}
        value={edit.prompt}
        onChange={(e) => setEdit({ ...edit, prompt: e.target.value })}
      />

      <div className="flex gap-3">
        <button
          onClick={() => onSave(edit)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:opacity-80"
        >
          <Save size={16} /> Save
        </button>

        <button
          onClick={() => onDelete(item.id)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
}
