'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from 'firebase/firestore';
import { firestore } from '@/utils/firebaseConfig';
import { uploadFiles } from '@/utils/uploadthing';
import { Plus, Trash2 } from 'lucide-react';

type Highlight = {
  id?: string;
  title: string;
  desc: string;
  imageUrl: string;
  order: number;
  showOnHome: boolean;
  isHero?: boolean;
};

export default function HighlightsAdminPage() {
  const [items, setItems] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string>('');

  const collectionPath = 'highlights';

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, collectionPath), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Highlight) }));
        setItems(data);
      } catch (err) {
        console.error('Error fetching highlights:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddHighlight = async () => {
    if (!newImage) return alert('Please select an image.');
    setSaving(true);
    try {
      const uploaded = await uploadFiles('fileUploader' as any, { files: [newImage] });
      const imageUrl = uploaded?.[0]?.url || '';
      await addDoc(collection(firestore, collectionPath), {
        title: 'New Highlight',
        desc: 'Enter description...',
        imageUrl,
        order: items.length + 1,
        showOnHome: false,
        isHero: false,
        admin_id: 'admin',
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to add highlight');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, field: keyof Highlight, value: any) => {
    try {
      const current = items.find((i) => i.id === id);
      if (!current || current[field] === value) return; // skip if no change

      const ref = doc(firestore, collectionPath, id);
      await updateDoc(ref, { [field]: value });

      // If setting new hero, unset others
      if (field === 'isHero' && value === true) {
        const others = items.filter((i) => i.id !== id && i.isHero);
        for (const o of others) {
          const otherRef = doc(firestore, collectionPath, o.id!);
          await updateDoc(otherRef, { isHero: false });
        }
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, [field]: value }
            : field === 'isHero' && value === true
            ? { ...i, isHero: false }
            : i
        )
      );
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this highlight?')) return;
    try {
      await deleteDoc(doc(firestore, collectionPath, id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-black p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">🏞️ Manage Highlights</h1>
      <p className="text-sm text-gray-700 mb-8">
        These images power both the <b>Home Page Preview</b> and the <b>“Things To Do”</b> page.
        You can also mark one as the <b>Homepage Hero</b>.
      </p>

      {/* Add New */}
      <div className="bg-white p-5 rounded-lg shadow-md mb-10 border border-gray-200">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Plus size={18} /> Add New Highlight
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setNewImage(file);
              if (file) setNewPreview(URL.createObjectURL(file));
            }}
            className="border p-2 rounded w-full sm:w-1/2"
          />
          <button
            disabled={saving}
            onClick={handleAddHighlight}
            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Uploading...' : 'Add Highlight'}
          </button>
        </div>
        {newPreview && (
          <img
            src={newPreview}
            alt="New preview"
            className="mt-4 rounded-lg shadow-md max-h-60 object-cover border"
          />
        )}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-700">Loading highlights...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col"
            >
              <img
                src={item.imageUrl || '/placeholder.png'}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex flex-col flex-grow">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdate(item.id!, 'title', e.target.value)}
                  className="font-semibold text-lg mb-1 border-b border-gray-300 focus:outline-none text-black"
                />
                <textarea
                  value={item.desc}
                  onChange={(e) => handleUpdate(item.id!, 'desc', e.target.value)}
                  className="text-sm text-black mb-2 border rounded p-2 flex-grow resize-none bg-gray-50"
                  rows={3}
                />

                {/* Controls */}
                <div className="flex flex-col gap-2 mt-2 text-sm text-black">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!!item.showOnHome}
                        onChange={(e) =>
                          handleUpdate(item.id!, 'showOnHome', e.target.checked)
                        }
                      />
                      Show on Home
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!!item.isHero}
                        onChange={(e) =>
                          handleUpdate(item.id!, 'isHero', e.target.checked)
                        }
                      />
                      Set as Hero
                    </label>
                  </div>

                  <div className="flex items-center gap-1 justify-end">
                    <span>Order:</span>
                    <input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        handleUpdate(item.id!, 'order', Number(e.target.value))
                      }
                      className="w-16 border rounded p-1 text-center bg-gray-50"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id!)}
                  className="mt-3 flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
