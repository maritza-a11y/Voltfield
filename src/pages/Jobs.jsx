import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react'
import { format } from 'date-fns'
import { getJobs } from '../lib/jobs'
import { JOB_STATUSES, JOB_TYPES } from '../lib/constants'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [search, setSearch]     = useState('')
  const [city, setCity]         = useState('')
  const [status, setStatus]     = useState('')
  const [jobType, setJobType]   = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  const [cities, setCities] = useState([])

  const load = async () => {
    setLoading(true)
    const { data } = await getJobs({
      search:    search.trim() || undefined,
      city:      city || undefined,
      status:    status || undefined,
      job_type:  jobType || undefined,
      from_date: fromDate || undefined,
      to_date:   toDate || undefined,
    })
    const results = data ?? []
    setJobs(results)
    // Collect unique cities for filter dropdown
    const unique = [...new Set(results.map((j) => j.city).filter(Boolean))].sort()
    if (unique.length) setCities(unique)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, city, status, jobType, fromDate, toDate])

  const clearFilters = () => {
    setCity(''); setStatus(''); setJobType(''); setFromDate(''); setToDate('')
  }
  const hasFilters = city || status || jobType || fromDate || toDate

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Jobs</h1>
          <p className="text-sm text-navy-500">{jobs.length} job{jobs.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/jobs/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1" style={{ minWidth: 220 }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            className="input pl-9"
            placeholder="Search by client, address, or job number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn-secondary gap-2 ${hasFilters ? 'border-brand-accent text-brand-accent' : ''}`}
          onClick={() => setShowFilters((o) => !o)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasFilters && <span className="rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-white">!</span>}
        </button>
        {hasFilters && (
          <button className="btn-ghost text-xs" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">City</label>
            <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Job Type</label>
            <select className="input" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">All types</option>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <div>
              <label className="label">From date</label>
              <input type="date" className="input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="label">To date</label>
              <input type="date" className="input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Jobs table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner label="Loading jobs…" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No jobs found"
          description={search || hasFilters ? 'Try adjusting your search or filters.' : 'Create your first job to get started.'}
          action={!search && !hasFilters && <Link to="/jobs/new" className="btn-primary mt-2">New Job</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60">
                  {['Job #', 'Client', 'Address', 'City', 'Type', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {jobs.map((job) => (
                  <tr key={job.id} className="group hover:bg-navy-50/40 transition">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy-700">{job.job_number}</td>
                    <td className="px-4 py-3 font-medium text-navy-800">{job.client_name}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-navy-500">{job.address}</td>
                    <td className="px-4 py-3 text-navy-500">{job.city}</td>
                    <td className="px-4 py-3 text-navy-500">{job.job_type}</td>
                    <td className="px-4 py-3"><Badge status={job.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-400">
                      {format(new Date(job.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/jobs/${job.id}`} className="btn-ghost py-1 text-xs opacity-0 group-hover:opacity-100">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
