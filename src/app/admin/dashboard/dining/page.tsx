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

type DiningItem = {
  id?: string;
  title: string;
  desc: string;
  imageUrl: string;
  price: string;
  order: number;
};

export default function DiningAdminPage() {
  const [items, setItems] = useState<DiningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string>('');

  // Load dining experiences
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, 'dining'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DiningItem) }));
        setItems(data);
      } catch (err) {
        console.error('Error fetching dining experiences:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

// Add new dining item
const handleAdd = async () => {
  if (!newImage) return alert('Please select an image.');
  setSaving(true);
  try {
    const uploaded = await uploadFiles('fileUploader' as any, { files: [newImage] });
    const imageUrl = uploaded?.[0]?.url || '';
    await addDoc(collection(firestore, 'dining'), {
      title: 'New Dining Experience',
      desc: 'Enter description...',
      imageUrl,
      price: 'P0',
      order: items.length + 1,
      admin_id: 'admin', // ✅ REQUIRED for Firestore rules
    });
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert('Failed to add dining experience');
  } finally {
    setSaving(false);
  }
};

// Update
const handleUpdate = async (id: string, field: keyof DiningItem, value: any) => {
  try {
    const ref = doc(firestore, 'dining', id);
    await updateDoc(ref, { [field]: value });
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  } catch (err) {
    console.error('Update failed', err);
  }
};

// Delete
const handleDelete = async (id: string) => {
  if (!confirm('Delete this dining experience?')) return;
  try {
    await deleteDoc(doc(firestore, 'dining', id));
    setItems((prev) => prev.filter((i) => i.id !== id));
  } catch (err) {
    console.error('Delete failed', err);
  }
};


  return (
    <main className="min-h-screen bg-gray-100 text-black p-8 font-sans">
      <h1 className="text-3xl font-bold text-black mb-6 flex items-center gap-2">
        🍽️ Manage Dining Experiences
      </h1>
      <p className="text-sm text-gray-700 mb-8">
        These entries appear on the <b>Dining at the Villa</b> page. You can set the image, title,
        description, price, and display order.
      </p>

      {/* Add New Item */}
      <div className="bg-white p-5 rounded-lg shadow-md mb-10 border border-gray-200">
        <h2 className="font-semibold mb-3 text-black flex items-center gap-2">
          <Plus size={18} /> Add New Dining Experience
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setNewImage(file);
              if (file) setNewPreview(URL.createObjectURL(file));
            }}
            className="border p-2 rounded w-full sm:w-1/2"
          />
          <button
            disabled={saving}
            onClick={handleAdd}
            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Uploading...' : 'Add Experience'}
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

      {/* List existing items */}
      {loading ? (
        <p className="text-gray-700">Loading dining experiences...</p>
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
              <div className="p-4 flex flex-col flex-grow text-black">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdate(item.id!, 'title', e.target.value)}
                  className="font-semibold text-lg mb-1 border-b border-gray-300 focus:outline-none"
                />
                <textarea
                  value={item.desc}
                  onChange={(e) => handleUpdate(item.id!, 'desc', e.target.value)}
                  className="text-sm mb-2 border rounded p-2 flex-grow resize-none bg-gray-50"
                  rows={3}
                />
                <div className="flex justify-between items-center text-sm mt-2">
                  <div className="flex items-center gap-1">
                    <span>Price:</span>
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) => handleUpdate(item.id!, 'price', e.target.value)}
                      className="border rounded px-2 py-1 w-24 text-center bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Order:</span>
                    <input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        handleUpdate(item.id!, 'order', Number(e.target.value))
                      }
                      className="border rounded px-2 py-1 w-16 text-center bg-gray-50"
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
