import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink/15 bg-paper/50 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-ink-soft/60">{icon}</div>}
      <p className="text-base font-medium text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function EmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
      <path d="M4 16H36" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
      <circle cx="12" cy="24" r="1.6" fill="currentColor" opacity="0.5" />
      <path d="M18 24H30" stroke="currentColor" strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />
      <path d="M18 28H26" stroke="currentColor" strokeWidth="1.6" opacity="0.3" strokeLinecap="round" />
    </svg>
  )
}
