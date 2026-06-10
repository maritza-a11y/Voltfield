import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Users, ShieldCheck, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { getTeamMembers, inviteTeamMember, removeTeamMember, updateTeamMember } from '../lib/team'
import Spinner from '../components/Spinner'

const ROLES = ['Admin', 'Technician']

export default function Settings() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail]       = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole]         = useState('Technician')

  const load = async () => {
    const { data } = await getTeamMembers()
    setMembers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Email is required.'); return }
    setSaving(true)
    const { error: err } = await inviteTeamMember(email.trim(), fullName.trim(), role)
    if (err) {
      setError(err.message.includes('unique') ? 'That email is already on the team.' : err.message)
    } else {
      setEmail(''); setFullName(''); setRole('Technician')
      await load()
    }
    setSaving(false)
  }

  const handleRoleChange = async (id, newRole) => {
    await updateTeamMember(id, { role: newRole })
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)))
  }

  const handleRemove = async (m) => {
    if (!confirm(`Remove ${m.email} from the team?`)) return
    await removeTeamMember(m.id)
    setMembers((prev) => prev.filter((x) => x.id !== m.id))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-sm text-navy-500">Manage the EVIDAC team.</p>
      </div>

      {/* Invite form */}
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-navy-800">
          <UserPlus className="h-5 w-5 text-brand-accent" /> Invite Team Member
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="invite-email">Email *</label>
            <input
              id="invite-email"
              type="email"
              className="input"
              placeholder="technician@evidac.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="invite-name">Full Name</label>
            <input
              id="invite-name"
              className="input"
              placeholder="Alex Torres"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="invite-role">Role</label>
            <select id="invite-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? <Spinner size="sm" label="" /> : <><UserPlus className="h-4 w-4" /> Invite</>}
            </button>
          </div>
        </form>
      </div>

      {/* Team list */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-navy-100 px-5 py-4">
          <Users className="h-5 w-5 text-navy-400" />
          <h2 className="font-semibold text-navy-800">Team Members</h2>
          <span className="ml-auto rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-600">
            {members.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner label="Loading team…" /></div>
        ) : members.length === 0 ? (
          <p className="py-10 text-center text-sm text-navy-400">No team members yet.</p>
        ) : (
          <ul className="divide-y divide-navy-50">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-600">
                  {(m.full_name ?? m.email).charAt(0).toUpperCase()}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-800">{m.full_name || m.email}</p>
                  {m.full_name && <p className="text-xs text-navy-400">{m.email}</p>}
                  <p className="text-xs text-navy-300">
                    Invited {format(new Date(m.invited_at), 'MMM d, yyyy')} ·{' '}
                    <span className={m.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}>
                      {m.status}
                    </span>
                  </p>
                </div>

                {/* Role badge + changer */}
                <div className="flex items-center gap-2">
                  {m.role === 'Admin' ? (
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Wrench className="h-4 w-4 text-navy-400" />
                  )}
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    className="input py-1 text-xs"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <button onClick={() => handleRemove(m)} className="text-navy-300 hover:text-red-500 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
