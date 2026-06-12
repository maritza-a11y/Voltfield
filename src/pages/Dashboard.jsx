import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, CheckCircle2, Clock, Image, FileText, FileCheck, Shield, ArrowRight } from 'lucide-react'
import { getDashboardStats, getJobs } from '../lib/jobs'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import DragDropZone from '../components/DragDropZone'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-navy-900">{value}</p>
        <p className="text-xs font-medium text-navy-500">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentJobs, setRecentJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [s, { data: jobs }] = await Promise.all([
      getDashboardStats(),
      getJobs(),
    ])
    setStats(s)  // getDashboardStats returns the object directly
    setRecentJobs((jobs ?? []).slice(0, 8))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner label="Loading dashboard…" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-navy-500">Overview of all EVIDAC jobs and documents.</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-4">
        <StatCard icon={Briefcase}    label="Total Jobs"     value={stats.total}     color="bg-navy-100 text-navy-600" />
        <StatCard icon={Clock}        label="Active"         value={stats.active}    color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={CheckCircle2} label="Completed"      value={stats.completed} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock}        label="On Hold"        value={stats.onHold}    color="bg-amber-100 text-amber-600" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Image}     label="Photos"    value={stats.photos}    color="bg-violet-100 text-violet-600" />
        <StatCard icon={FileText}  label="Invoices"  value={stats.invoices}  color="bg-sky-100 text-sky-600" />
        <StatCard icon={FileCheck} label="Contracts" value={stats.contracts} color="bg-teal-100 text-teal-600" />
        <StatCard icon={Shield}    label="Permits"   value={stats.permits}   color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent jobs */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
            <h2 className="font-semibold text-navy-800">Recent Jobs</h2>
            <Link to="/jobs" className="flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="py-10 text-center text-sm text-navy-400">No jobs yet. <Link to="/jobs/new" className="font-semibold text-brand-accent hover:underline">Create one</Link>.</p>
          ) : (
            <ul className="divide-y divide-navy-50">
              {recentJobs.map((job) => (
                <li key={job.id}>
                  <Link to={`/jobs/${job.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-navy-50/60 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-800">{job.client_name}</p>
                      <p className="truncate text-xs text-navy-400">
                        {job.job_number} · {job.city}
                      </p>
                    </div>
                    <Badge status={job.status} />
                    <p className="shrink-0 text-xs text-navy-400">
                      {format(new Date(job.created_at), 'MMM d')}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Smart drag-drop organizer */}
        <DragDropZone onUploaded={load} />
      </div>
    </div>
  )
}
