import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudUpload, Check, X, ChevronDown, AlertCircle } from 'lucide-react'
import { getJobs, uploadJobFile } from '../lib/jobs'
import { readExif } from '../lib/exif'
import { createNotification } from '../lib/notifications'
import { EXT_TO_SECTION, NAME_KEYWORDS_TO_SECTION, SECTIONS } from '../lib/constants'
import Spinner from './Spinner'

function guessSectionFromFile(file) {
  const name = file.name.toLowerCase()
  const ext = name.split('.').pop()
  if (EXT_TO_SECTION[ext]) return EXT_TO_SECTION[ext]
  if (file.type.startsWith('image/')) return 'photos'
  if (file.type.startsWith('video/')) return 'videos'
  for (const [section, keywords] of Object.entries(NAME_KEYWORDS_TO_SECTION)) {
    if (keywords.some((k) => name.includes(k))) return section
  }
  return 'other'
}

function guessJobFromFile(file, jobs) {
  const name = file.name.toUpperCase()
  const m = name.match(/JOB[-_]?(\d+)/)
  if (m) {
    const num = `JOB-${m[1].padStart(3, '0')}`
    const found = jobs.find((j) => j.job_number === num)
    if (found) return found
  }
  // Match client name words (4+ chars)
  for (const job of jobs) {
    const words = job.client_name.toUpperCase().split(/\W+/).filter((w) => w.length >= 4)
    if (words.some((w) => name.includes(w))) return job
  }
  return null
}

export default function DragDropZone({ onUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [jobs, setJobs] = useState([])
  const [pending, setPending] = useState([]) // { file, suggestedJob, suggestedSection, approved }
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    getJobs().then(({ data }) => setJobs(data ?? []))
  }, [])

  const analyse = (files) => {
    const items = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      suggestedJob:     guessJobFromFile(file, jobs),
      suggestedSection: guessSectionFromFile(file),
      approved: null,
    }))
    setPending((prev) => [...prev, ...items])
    setDone(false)
  }

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      analyse(e.dataTransfer.files)
    },
    [jobs],
  )

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const update = (id, patch) =>
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const handleApproveAll = async () => {
    const approved = pending.filter((p) => p.approved !== false && p.suggestedJob)
    if (!approved.length) return
    setUploading(true)
    for (const item of approved) {
      const exif = item.suggestedSection === 'photos' ? await readExif(item.file) : null
      const { error } = await uploadJobFile(
        item.suggestedJob.id,
        item.suggestedSection,
        item.file,
        exif,
      )
      if (!error) {
        await createNotification(
          `File uploaded via drag-drop: ${item.file.name}`,
          item.suggestedJob.id,
          item.suggestedJob.job_number,
        )
      }
    }
    setPending([])
    setUploading(false)
    setDone(true)
    onUploaded?.()
  }

  const sectionLabel = (key) => SECTIONS.find((s) => s.key === key)?.label ?? key

  return (
    <div className="card p-6">
      <h2 className="mb-4 font-semibold text-navy-800">Smart File Organizer</h2>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition
          ${dragging ? 'border-brand-accent bg-amber-50' : 'border-navy-200 hover:border-brand-accent hover:bg-amber-50/30'}`}
      >
        <CloudUpload className={`h-10 w-10 ${dragging ? 'text-brand-accent' : 'text-navy-300'}`} />
        <div className="text-center">
          <p className="font-semibold text-navy-700">Drop files here or click to browse</p>
          <p className="mt-1 text-sm text-navy-400">
            VoltField will suggest the right job and folder based on the filename.
          </p>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => analyse(e.target.files)} />
      </div>

      {done && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> Files uploaded successfully.
        </div>
      )}

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy-700">
              Review suggestions — approve or skip each file before saving.
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={() => setPending([])}>
                Clear all
              </button>
              <button className="btn-primary py-1.5 text-xs" onClick={handleApproveAll} disabled={uploading}>
                {uploading ? <Spinner size="sm" label="" /> : 'Upload approved'}
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {pending.map((item) => (
              <li
                key={item.id}
                className={`rounded-xl border p-4 transition ${
                  item.approved === false
                    ? 'border-navy-100 opacity-40'
                    : item.approved
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-navy-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p className="flex-1 min-w-0 truncate text-sm font-medium text-navy-800">
                    {item.file.name}
                  </p>

                  {/* Job picker */}
                  <div className="relative">
                    <select
                      value={item.suggestedJob?.id ?? ''}
                      onChange={(e) => {
                        const job = jobs.find((j) => j.id === e.target.value) ?? null
                        update(item.id, { suggestedJob: job })
                      }}
                      className="input py-1.5 pr-8 text-xs"
                    >
                      <option value="">— Select job —</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.job_number} · {j.client_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section picker */}
                  <select
                    value={item.suggestedSection}
                    onChange={(e) => update(item.id, { suggestedSection: e.target.value })}
                    className="input py-1.5 text-xs"
                  >
                    {SECTIONS.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>

                  {/* Approve / skip */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => update(item.id, { approved: true })}
                      className={`rounded-lg p-1.5 ${item.approved ? 'bg-emerald-500 text-white' : 'text-navy-400 hover:text-emerald-600'}`}
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => update(item.id, { approved: false })}
                      className={`rounded-lg p-1.5 ${item.approved === false ? 'bg-red-400 text-white' : 'text-navy-400 hover:text-red-500'}`}
                      title="Skip"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {!item.suggestedJob && item.approved !== false && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" /> Select a job to include this file.
                  </p>
                )}
                {item.suggestedJob && item.approved === null && (
                  <p className="mt-2 text-xs text-navy-400">
                    Suggested: <strong>{item.suggestedJob.job_number}</strong> →{' '}
                    <strong>{sectionLabel(item.suggestedSection)}</strong>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
