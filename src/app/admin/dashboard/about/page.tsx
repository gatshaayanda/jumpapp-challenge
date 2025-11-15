'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/utils/firebaseConfig';
import { uploadFiles } from '@/utils/uploadthing';
import { Image, Save } from 'lucide-react';

type AboutImages = {
  heroUrl: string;
  storyUrl: string;
};

export default function AboutAdminPage() {
  const [images, setImages] = useState<AboutImages>({ heroUrl: '', storyUrl: '' });
  const [previewHero, setPreviewHero] = useState<string>('');
  const [previewStory, setPreviewStory] = useState<string>('');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔹 Load existing images
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(firestore, 'about', 'images');
        const snap = await getDoc(ref);
        if (snap.exists()) setImages(snap.data() as AboutImages);
      } catch (err) {
        console.error('Failed to load images:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 Save changes (upload any selected files + update Firestore)
  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      let heroUrl = images.heroUrl;
      let storyUrl = images.storyUrl;

      // Upload hero image if new file selected
      if (heroFile) {
        const uploaded = await uploadFiles('fileUploader' as any, { files: [heroFile] });
        heroUrl = uploaded?.[0]?.url || heroUrl;
      }

      // Upload story image if new file selected
      if (storyFile) {
        const uploaded = await uploadFiles('fileUploader' as any, { files: [storyFile] });
        storyUrl = uploaded?.[0]?.url || storyUrl;
      }

      const updated = { heroUrl, storyUrl, admin_id: 'admin' };
      await setDoc(doc(firestore, 'about', 'images'), updated);
      setImages(updated);

      setHeroFile(null);
      setStoryFile(null);
      alert('✅ About page images updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-black p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">🕯️ Manage About Page Images</h1>
      <p className="text-sm text-gray-700 mb-8">
        Upload or replace the <b>Hero</b> and <b>Story</b> images shown on the About page.
      </p>

      {loading ? (
        <p>Loading current images...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Hero Image */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <Image size={18} /> Hero Section Image
            </h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setHeroFile(file);
                if (file) setPreviewHero(URL.createObjectURL(file));
              }}
              className="border p-2 rounded w-full"
            />
            <div className="mt-4">
              <img
                src={previewHero || images.heroUrl || '/placeholder.png'}
                alt="Hero"
                className="rounded-md shadow max-h-64 w-full object-cover border"
              />
            </div>
          </div>

          {/* Story Image */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <Image size={18} /> Story Section Image
            </h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setStoryFile(file);
                if (file) setPreviewStory(URL.createObjectURL(file));
              }}
              className="border p-2 rounded w-full"
            />
            <div className="mt-4">
              <img
                src={previewStory || images.storyUrl || '/placeholder.png'}
                alt="Story"
                className="rounded-md shadow max-h-64 w-full object-cover border"
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {/* Save Button */}
      <div className="mt-10 text-center">
        <button
          disabled={saving}
          onClick={handleSave}
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </main>
  );
}
