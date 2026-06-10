import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Trash2, ChevronsDownUp, ChevronsUpDown, MapPin,
} from 'lucide-react'
import { format } from 'date-fns'
import { deleteJob, getJob, getJobFiles, updateJob } from '../lib/jobs'
import { SECTIONS } from '../lib/constants'
import Badge from '../components/Badge'
import StatusDropdown from '../components/StatusDropdown'
import DocSection from '../components/DocSection'
import JobMiniMap from '../components/JobMiniMap'
import Spinner from '../components/Spinner'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [photoMarkers, setPhotoMarkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState(
    Object.fromEntries(SECTIONS.map((s) => [s.key, true])),
  )

  useEffect(() => {
    const load = async () => {
      const { data } = await getJob(id)
      setJob(data)
      // Load photo GPS pins for the mini-map
      const { data: photos } = await getJobFiles(id, 'photos')
      setPhotoMarkers(
        (photos ?? []).filter((f) => f.photo_lat && f.photo_lng).map((f) => ({
          lat: f.photo_lat,
          lng: f.photo_lng,
          file_name: f.file_name,
        })),
      )
      setLoading(false)
    }
    load()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    const { data } = await updateJob(id, { status: newStatus })
    if (data) setJob(data)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this job and all its files? This cannot be undone.')) return
    await deleteJob(id)
    navigate('/jobs')
  }

  const allOpen  = () => setOpenSections(Object.fromEntries(SECTIONS.map((s) => [s.key, true])))
  const allClose = () => setOpenSections(Object.fromEntries(SECTIONS.map((s) => [s.key, false])))
  const anyOpen  = Object.values(openSections).some(Boolean)

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner label="Loading job…" /></div>
  }
  if (!job) {
    return (
      <div className="py-20 text-center">
        <p className="text-navy-500">Job not found.</p>
        <Link to="/jobs" className="btn-primary mt-4">← Back to Jobs</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/jobs" className="btn-ghost text-sm">
          <ArrowLeft className="h-4 w-4" /> Jobs
        </Link>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={anyOpen ? allClose : allOpen}>
            {anyOpen
              ? <><ChevronsDownUp className="h-4 w-4" /> Collapse All</>
              : <><ChevronsUpDown className="h-4 w-4" /> Expand All</>}
          </button>
          <Link to={`/jobs/${id}/edit`} className="btn-secondary text-sm">
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <button className="btn-secondary text-sm text-red-500 hover:text-red-600" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Job header card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest text-navy-400">{job.job_number}</span>
              <StatusDropdown current={job.status} onChange={handleStatusChange} />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-navy-900">{job.client_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-navy-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-navy-400" />
                {job.address}, {job.city}
              </span>
              <span>{job.job_type}</span>
              <span>Added {format(new Date(job.created_at), 'MMM d, yyyy')}</span>
            </div>
            {job.notes && <p className="mt-3 rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-600">{job.notes}</p>}
          </div>

          {/* Mini map */}
          <div className="w-full lg:w-72">
            <JobMiniMap job={job} photoMarkers={photoMarkers} />
          </div>
        </div>
      </div>

      {/* File sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <DocSection
            key={section.key}
            job={job}
            section={section}
            open={openSections[section.key]}
            onToggle={() =>
              setOpenSections((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
            }
          />
        ))}
      </div>
    </div>
  )
}
