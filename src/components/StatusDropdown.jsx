import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { JOB_STATUSES, STATUS_COLORS } from '../lib/constants'

export default function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cls = STATUS_COLORS[current] ?? 'bg-navy-100 text-navy-600 border-navy-200'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
      >
        {current}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border border-navy-100 bg-white py-1 shadow-lg">
          {JOB_STATUSES.map((s) => (
            <button
              key={s}
              className="w-full px-3 py-1.5 text-left text-sm font-medium text-navy-700 hover:bg-navy-50"
              onClick={() => { onChange(s); setOpen(false) }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
