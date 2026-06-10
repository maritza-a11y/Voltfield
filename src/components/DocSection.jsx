import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown, ChevronRight, Upload, Trash2, Download,
  Image, FileText, FileCheck, ShieldCheck, File, Layers, Video, MapPin,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getJobFiles, uploadJobFile, deleteJobFile, getPublicUrl } from '../lib/jobs'
import { readExif } from '../lib/exif'
import { createNotification } from '../lib/notifications'
import Spinner from './Spinner'

const ICONS = { Image, FileText, FileCheck, ShieldCheck, File, Layers, Video }

function fmt(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocSection({ job, section, open, onToggle }) {
  const { key, label, icon, accept } = section
  const Icon = ICONS[icon] ?? File
  const inputRef = useRef(null)

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await getJobFiles(job.id, key)
    setFiles(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [job.id, key])

  const handleUpload = async (e) => {
    const picked = Array.from(e.target.files ?? [])
    if (!picked.length) return
    setUploading(true)
    for (const file of picked) {
      const exif = key === 'photos' ? await readExif(file) : null
      const { error } = await uploadJobFile(job.id, key, file, exif)
      if (!error) {
        await createNotification(
          `New file uploaded to ${label}: ${file.name}`,
          job.id,
          job.job_number,
        )
      }
    }
    await load()
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDelete = async (f) => {
    if (!confirm(`Delete "${f.file_name}"?`)) return
    await deleteJobFile(f.id, f.storage_path)
    setFiles((prev) => prev.filter((x) => x.id !== f.id))
  }

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        onClick={onToggle}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-100">
          <Icon className="h-4 w-4 text-navy-600" />
        </span>
        <span className="flex-1 font-semibold text-navy-800">{label}</span>
        {files.length > 0 && (
          <span className="mr-2 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-600">
            {files.length}
          </span>
        )}
        {open ? <ChevronDown className="h-4 w-4 text-navy-400" /> : <ChevronRight className="h-4 w-4 text-navy-400" />}
      </button>

      {open && (
        <div className="border-t border-navy-100">
          {/* Upload row */}
          <div className="flex items-center justify-between bg-navy-50/50 px-5 py-3">
            <p className="text-xs text-navy-500">{files.length} file{files.length !== 1 ? 's' : ''}</p>
            <div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={accept}
                className="hidden"
                onChange={handleUpload}
              />
              <button
                className="btn-primary py-1.5 text-xs"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? <Spinner size="sm" label="" /> : <><Upload className="h-3.5 w-3.5" /> Upload</>}
              </button>
            </div>
          </div>

          {/* File list */}
          {loading ? (
            <div className="flex justify-center py-8"><Spinner label="Loading…" /></div>
          ) : files.length === 0 ? (
            <p className="py-8 text-center text-sm text-navy-400">No {label.toLowerCase()} yet.</p>
          ) : (
            <ul className="divide-y divide-navy-50">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-navy-400" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-navy-800">{f.file_name}</p>
                    <p className="text-xs text-navy-400">
                      {fmt(f.file_size)}
                      {f.uploaded_at && ` · ${formatDistanceToNow(new Date(f.uploaded_at), { addSuffix: true })}`}
                    </p>
                    {key === 'photos' && f.photo_lat && f.photo_lng && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600">
                        <MapPin className="h-3 w-3" />
                        {f.photo_lat.toFixed(5)}, {f.photo_lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                  <a
                    href={getPublicUrl(f.storage_path)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-navy-400 hover:text-navy-700"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(f)}
                    className="shrink-0 text-navy-300 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
