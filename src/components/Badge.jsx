import { STATUS_COLORS } from '../lib/constants'

export default function Badge({ status }) {
  const cls = STATUS_COLORS[status] ?? 'bg-navy-100 text-navy-600 border-navy-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}
