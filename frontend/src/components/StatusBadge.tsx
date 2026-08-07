import { STATUS_LABEL, type StatusValue } from '../lib/types'

const STYLES: Record<StatusValue, string> = {
  created: 'bg-ink/6 text-ink-soft',
  submitted: 'bg-violet-100 text-violet-700',
  released: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  disputed: 'bg-coral-100 text-coral-700',
  expired: 'bg-ink/5 text-ink-soft/70',
  refunded: 'bg-ink/5 text-ink-soft/70',
}

export function StatusBadge({ status }: { status: StatusValue }) {
  return (
    <span className={`label-mono inline-flex items-center rounded-full px-3 py-1 text-[10px] ${STYLES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}
