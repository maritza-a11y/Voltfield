import { useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getNotifications, markRead, markAllRead } from '../lib/notifications'

const POLL_MS = 15_000

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const ref = useRef(null)

  const load = async () => {
    const { data } = await getNotifications()
    setItems(data ?? [])
  }

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = items.filter((n) => !n.read).length

  const handleRead = async (id) => {
    await markRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleReadAll = async () => {
    await markAllRead()
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-navy-400 transition hover:bg-navy-100 hover:text-navy-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-navy-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
            <p className="font-semibold text-navy-800">Notifications</p>
            {unread > 0 && (
              <button onClick={handleReadAll} className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-navy-400">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 border-b border-navy-50 px-4 py-3 last:border-0 ${
                    n.read ? 'opacity-60' : 'bg-amber-50/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy-700">{n.message}</p>
                    {n.job_number && <p className="text-xs text-navy-400">{n.job_number}</p>}
                    <p className="mt-0.5 text-xs text-navy-300">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <button onClick={() => handleRead(n.id)} className="shrink-0 text-navy-300 hover:text-brand-accent">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
