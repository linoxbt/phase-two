import { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import { listAllIds, getEngagement } from '../lib/surety'
import { NETWORKS as NETWORK_REGISTRY, useNetwork } from '../lib/network'
import type { Engagement, StatusValue } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'

const STATUS_ORDER: StatusValue[] = ['created', 'submitted', 'released', 'rejected', 'disputed', 'expired']

const STATUS_BAR_COLOR: Record<StatusValue, string> = {
  created: 'bg-ink/20',
  submitted: 'bg-violet-400',
  released: 'bg-emerald-400',
  rejected: 'bg-red-400',
  disputed: 'bg-coral-400',
  expired: 'bg-ink/10',
}

export function Stats() {
  const network = useNetwork()
  const [engagements, setEngagements] = useState<Engagement[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setEngagements(null)
    setError(null)
    ;(async () => {
      try {
        const ids = await listAllIds()
        const items = await Promise.all(ids.map((id) => getEngagement(id)))
        if (!cancelled) setEngagements(items)
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load stats')
      }
    })()
    return () => {
      cancelled = true
    }
    // network is a dependency so switching networks re-fetches against the newly selected contract
  }, [network])

  const total = engagements?.length ?? 0
  const totalVolume = engagements?.reduce((sum, e) => sum + BigInt(e.amount), 0n) ?? 0n
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<StatusValue, number>
  for (const e of engagements ?? []) counts[e.status] = (counts[e.status] ?? 0) + 1
  const judged = counts.released + counts.rejected + counts.disputed
  const disputeRate = judged > 0 ? Math.round(((counts.rejected + counts.disputed) / judged) * 100) : 0

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 text-left">
        <p className="label-mono text-xs text-coral-600">Live on {NETWORK_REGISTRY[network].label}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Transparency</h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Every engagement on Phase Two is public on-chain data - no aggregation happens off-chain. This page reads
          it directly from the deployed contract.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {engagements === null && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      )}

      {engagements !== null && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-6">
              <p className="font-display text-3xl font-bold text-ink">
                <AnimatedCounter to={total} />
              </p>
              <p className="mt-1 text-sm text-ink-soft">Total engagements</p>
            </Card>
            <Card className="p-6">
              <p className="font-display text-3xl font-bold text-ink">{formatEther(totalVolume)} GEN</p>
              <p className="mt-1 text-sm text-ink-soft">Total volume locked</p>
            </Card>
            <Card className="p-6">
              <p className="font-display text-3xl font-bold text-ink">
                <AnimatedCounter to={disputeRate} suffix="%" />
              </p>
              <p className="mt-1 text-sm text-ink-soft">Dispute rate among judged engagements</p>
            </Card>
          </div>

          <Card className="mt-4 p-6">
            <p className="label-mono mb-4 text-xs text-ink-soft">By status</p>
            {total === 0 ? (
              <p className="text-sm text-ink-soft">No engagements yet.</p>
            ) : (
              <div className="space-y-3">
                {STATUS_ORDER.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-ink-soft">{STATUS_LABEL[s]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/5">
                      <div
                        className={`h-full rounded-full ${STATUS_BAR_COLOR[s]}`}
                        style={{ width: total > 0 ? `${(counts[s] / total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-medium text-ink">{counts[s]}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
