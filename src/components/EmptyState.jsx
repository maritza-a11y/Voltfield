export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-100">
          <Icon className="h-7 w-7 text-navy-400" />
        </div>
      )}
      <p className="font-semibold text-navy-700">{title}</p>
      {description && <p className="max-w-xs text-sm text-navy-400">{description}</p>}
      {action}
    </div>
  )
}
