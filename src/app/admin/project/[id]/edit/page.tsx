'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { firestore } from '@/utils/firebaseConfig'
import AdminHubLoader from '@/components/AdminHubLoader'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const id = params.id!

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
    live_revisable_draft_link: '',
    admin_notes: '',
    progress_update: '',
  })

  useEffect(() => {
    if (!id) {
      router.replace('/admin/project')
      return
    }

    ;(async () => {
      try {
        const snap = await getDoc(doc(firestore, 'projects', id))
        if (!snap.exists()) throw new Error('Project not found.')
        const data = snap.data()
        setForm({
          client_name: data.client_name || '',
          client_email: data.client_email || '',
          business: data.business || '',
          industry: data.industry || '',
          goals: data.goals || '',
          painpoints: data.painpoints || '',
          pages: data.pages || '',
          content: data.content || '',
          features: data.features || '',
          admin_panel: data.admin_panel || false,
          design_prefs: data.design_prefs || '',
          examples: data.examples || '',
          mood: data.mood || '',
          resource_link: data.resource_link || '',
          live_revisable_draft_link: data.live_revisable_draft_link || '',
          admin_notes: data.admin_notes || '',
          progress_update: data.progress_update || '',
        })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, router])

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await updateDoc(doc(firestore, 'projects', id), { ...form })
      router.push('/admin/project')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      const res = await fetch(`/api/project/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg || 'Delete failed')
      }
      router.push('/admin/projects')
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (loading) return <AdminHubLoader />

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Edit Project</h1>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          value={form.client_name}
          onChange={e => handleChange('client_name', e.target.value)}
          placeholder="Client Name"
          required
          className="w-full border px-3 py-2 rounded"
        />

        <input
          value={form.client_email}
          onChange={e => handleChange('client_email', e.target.value)}
          placeholder="Client Email"
          type="email"
          required
          className="w-full border px-3 py-2 rounded"
        />

        <input
          value={form.business}
          onChange={e => handleChange('business', e.target.value)}
          placeholder="Business"
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

        <textarea
          value={form.goals}
          onChange={e => handleChange('goals', e.target.value)}
          placeholder="Goals"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={form.painpoints}
          onChange={e => handleChange('painpoints', e.target.value)}
          placeholder="Pain Points"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={form.pages}
          onChange={e => handleChange('pages', e.target.value)}
          placeholder="Pages"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={form.content}
          onChange={e => handleChange('content', e.target.value)}
          placeholder="Content"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={form.features}
          onChange={e => handleChange('features', e.target.value)}
          placeholder="Features"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={form.design_prefs}
          onChange={e => handleChange('design_prefs', e.target.value)}
          placeholder="Design Preferences"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={form.examples}
          onChange={e => handleChange('examples', e.target.value)}
          placeholder="Examples / Competitors"
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          value={form.mood}
          onChange={e => handleChange('mood', e.target.value)}
          placeholder="Mood / Branding"
          className="w-full border px-3 py-2 rounded"
        />

        <input
          value={form.resource_link}
          onChange={e => handleChange('resource_link', e.target.value)}
          placeholder="Google Docs / File Link"
          className="w-full border px-3 py-2 rounded"
        />

        <input
          value={form.live_revisable_draft_link}
          onChange={e => handleChange('live_revisable_draft_link', e.target.value)}
          placeholder="Live Draft Link (optional)"
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
          value={form.progress_update}
          onChange={e => handleChange('progress_update', e.target.value)}
          placeholder="Progress Update"
          className="w-full border px-3 py-2 rounded min-h-[80px]"
        />

        <textarea
          value={form.admin_notes}
          onChange={e => handleChange('admin_notes', e.target.value)}
          placeholder="Admin Notes (internal only)"
          className="w-full border px-3 py-2 rounded min-h-[80px] bg-gray-100"
        />

        <div className="flex items-center gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Update
          </button>
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">
            Delete
          </button>
          <button type="button" onClick={() => router.push('/admin/project')} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
