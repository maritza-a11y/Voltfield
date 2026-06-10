export default function Spinner({ label = 'Loading…', size = 'md' }) {
  const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7'
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        className={`${s} animate-spin text-brand-accent`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label && <p className="text-sm text-navy-500">{label}</p>}
    </div>
  )
}
