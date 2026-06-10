import { useEffect, useState } from 'react'
import { Download, FolderOpen, SlidersHorizontal, X } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { getAllFiles, getJobs, getPublicUrl } from '../lib/jobs'
import { SECTIONS } from '../lib/constants'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documents() {
  const [files, setFiles] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [section, setSection] = useState('')
  const [jobId, setJobId]     = useState('')
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: f }, { data: j }] = await Promise.all([
      getAllFiles({ section: section || undefined, job_id: jobId || undefined, from: from || undefined, to: to || undefined }),
      getJobs(),
    ])
    setFiles(f ?? [])
    setJobs(j ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [section, jobId, from, to])

  const hasFilters = section || jobId || from || to

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Documents</h1>
          <p className="text-sm text-navy-500">{files.length} file{files.length !== 1 ? 's' : ''} across all jobs</p>
        </div>
        <button
          className={`btn-secondary ${hasFilters ? 'border-brand-accent text-brand-accent' : ''}`}
          onClick={() => setShowFilters((o) => !o)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {hasFilters && <span className="rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-white">!</span>}
        </button>
      </div>

      {showFilters && (
        <div className="card grid gap-4 p-4 sm:grid-cols-4">
          <div>
            <label className="label">File Type</label>
            <select className="input" value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">All types</option>
              {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Job</label>
            <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">All jobs</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.job_number} · {j.client_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From date</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label">To date</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            {hasFilters && (
              <button className="btn-ghost mt-1 self-start text-xs" onClick={() => { setSection(''); setJobId(''); setFrom(''); setTo('') }}>
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner label="Loading documents…" /></div>
      ) : files.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents found" description="Upload files to jobs to see them here." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60">
                  {['File', 'Type', 'Job', 'Size', 'Uploaded', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {files.map((f) => {
                  const sectionMeta = SECTIONS.find((s) => s.key === f.section)
                  return (
                    <tr key={f.id} className="hover:bg-navy-50/40 transition">
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-navy-800">
                        {f.file_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-600">
                          {sectionMeta?.label ?? f.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy-500">
                        {f.jobs ? (
                          <a href={`/jobs/${f.job_id}`} className="hover:text-brand-accent hover:underline">
                            {f.jobs.job_number} · {f.jobs.client_name}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-navy-400">{fmt(f.file_size)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-navy-400">
                        {formatDistanceToNow(new Date(f.uploaded_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={getPublicUrl(f.storage_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost py-1 text-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
