export const Status = {
  CREATED: 'created',
  SUBMITTED: 'submitted',
  RELEASED: 'released',
  REJECTED: 'rejected',
  DISPUTED: 'disputed',
  EXPIRED: 'expired',
} as const

export type StatusValue = (typeof Status)[keyof typeof Status]

export interface Engagement {
  id: number
  depositor: `0x${string}`
  counterparty: `0x${string}`
  amount: number
  deliverable_spec: string
  evidence_urls: string[]
  notes: string
  status: StatusValue
  decision_reasoning: string
  created_at: number
  deadline: number
  dispute_round: number
  funds_released: boolean
}

export const STATUS_LABEL: Record<StatusValue, string> = {
  created: 'Created',
  submitted: 'Submitted',
  released: 'Released',
  rejected: 'Rejected',
  disputed: 'Disputed',
  expired: 'Expired',
}
