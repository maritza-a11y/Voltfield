import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createJob, getJob, updateJob } from '../lib/jobs'
import { geocodeAddress } from '../lib/geocode'
import { JOB_STATUSES, JOB_TYPES } from '../lib/constants'
import Spinner from '../components/Spinner'

const EMPTY = {
  client_name: '',
  address: '',
  city: '',
  job_type: '',
  status: 'Active',
  notes: '',
}

export default function JobForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getJob(id).then(({ data }) => {
      if (data) setForm({
        client_name: data.client_name,
        address:     data.address,
        city:        data.city,
        job_type:    data.job_type,
        status:      data.status,
        notes:       data.notes ?? '',
      })
      setLoading(false)
    })
  }, [id])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.client_name.trim() || !form.address.trim() || !form.city.trim() || !form.job_type) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      // Best-effort geocode
      const coords = await geocodeAddress(form.address, form.city)
      const payload = { ...form, lat: coords?.lat ?? null, lng: coords?.lng ?? null }

      if (isEdit) {
        const { error: err } = await updateJob(id, payload)
        if (err) throw err
        navigate(`/jobs/${id}`)
      } else {
        const { data, error: err } = await createJob(payload)
        if (err) throw err
        navigate(`/jobs/${data.id}`)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner label="Loading…" /></div>
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to={isEdit ? `/jobs/${id}` : '/jobs'} className="btn-ghost text-sm">
          <ArrowLeft className="h-4 w-4" /> {isEdit ? 'Back to job' : 'Jobs'}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-navy-900">{isEdit ? 'Edit Job' : 'New Job'}</h1>
        <p className="text-sm text-navy-500">
          {isEdit ? 'Update job details.' : 'Fill in the details to create a new job.'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="client_name">Client Name *</label>
          <input id="client_name" className="input" placeholder="e.g. Johnson & Sons" value={form.client_name} onChange={set('client_name')} required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="address">Address *</label>
            <input id="address" className="input" placeholder="123 Main St" value={form.address} onChange={set('address')} required />
          </div>
          <div>
            <label className="label" htmlFor="city">City *</label>
            <input id="city" className="input" placeholder="Los Angeles" value={form.city} onChange={set('city')} required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="job_type">Job Type *</label>
            <select id="job_type" className="input" value={form.job_type} onChange={set('job_type')} required>
              <option value="">Select type…</option>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" value={form.status} onChange={set('status')}>
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            className="input min-h-[90px] resize-y"
            placeholder="Any additional information…"
            value={form.notes}
            onChange={set('notes')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link to={isEdit ? `/jobs/${id}` : '/jobs'} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner size="sm" label="" /> : isEdit ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  )
}
