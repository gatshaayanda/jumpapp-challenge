'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'

export default function CreateProjectPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    business: '',
    industry: '',
    goals: '',
    painpoints: '',
    pages: '',
    content: '',
    features: '',
    admin_panel: false,
    design_prefs: '',
    examples: '',
    mood: '',
    resource_link: '',
    admin_notes: '',
    progress_update: '',
  })

  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setSuccess(false)

    try {
      await addDoc(collection(firestore, 'projects'), {
        ...form,
        admin_id: 'admin',
        created_at: serverTimestamp(),
      })

      setMessage('✅ Project created!')
      setSuccess(true)

      setForm({
        client_name: '',
        client_email: '',
        business: '',
        industry: '',
        goals: '',
        painpoints: '',
        pages: '',
        content: '',
        features: '',
        admin_panel: false,
        design_prefs: '',
        examples: '',
        mood: '',
        resource_link: '',
        admin_notes: '',
        progress_update: '',
      })
    } catch (err: any) {
      setMessage('❌ Error: ' + err.message)
      setSuccess(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-14 px-4">
      <button
        onClick={() => router.push('/admin/dashboard')}
        className="mb-4 text-sm text-gray-500 hover:underline"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <input
            placeholder="Client Full Name"
            value={form.client_name}
            onChange={e => handleChange('client_name', e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
          <input
            placeholder="Client Email"
            type="email"
            value={form.client_email}
            onChange={e => handleChange('client_email', e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
          <input
            placeholder="Business Name"
            value={form.business}
            onChange={e => handleChange('business', e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <select
            value={form.industry}
            onChange={e => handleChange('industry', e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Industry</option>
            {[
              'Beauty','Church','Finance','Media','Events','Fashion',
              'Gaming','Education','eCommerce','Repair','Insurance',
              'Food & Beverage','Transport & Logistics','Other'
            ].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <input
          placeholder="Google Docs / Sheets / File Link (optional)"
          value={form.resource_link}
          onChange={e => handleChange('resource_link', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          placeholder="Project Goals"
          value={form.goals}
          onChange={e => handleChange('goals', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Pain Points"
          value={form.painpoints}
          onChange={e => handleChange('painpoints', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Pages"
          value={form.pages}
          onChange={e => handleChange('pages', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Content"
          value={form.content}
          onChange={e => handleChange('content', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Features"
          value={form.features}
          onChange={e => handleChange('features', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Design Preferences"
          value={form.design_prefs}
          onChange={e => handleChange('design_prefs', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Examples / Inspiration"
          value={form.examples}
          onChange={e => handleChange('examples', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Mood / Branding"
          value={form.mood}
          onChange={e => handleChange('mood', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={form.admin_panel}
            onChange={e => handleChange('admin_panel', e.target.checked)}
            className="mr-2"
          />
          <span>Client wants access to admin panel</span>
        </div>

        <textarea
          placeholder="Admin Notes (Internal Only)"
          value={form.admin_notes}
          onChange={e => handleChange('admin_notes', e.target.value)}
          className="w-full border px-3 py-2 rounded bg-gray-100"
        />
        <textarea
          placeholder="Progress Update (Client will see this)"
          value={form.progress_update}
          onChange={e => handleChange('progress_update', e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit Project
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>
        </div>

        {message && (
          <p
            className={`font-semibold text-center ${
              success ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
