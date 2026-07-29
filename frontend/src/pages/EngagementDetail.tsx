import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { TransactionHash } from 'genlayer-js/types'
import type { EIP1193Provider } from 'viem'
import { useWallet } from '../lib/wallet'
import { getEngagement, submitDeliverable, requestRelease, raiseDispute, refundExpired } from '../lib/surety'
import { getReadClient } from '../lib/genlayer-client'
import { withRetry } from '../lib/retry'
import { useNetwork } from '../lib/network'
import { markSeen } from '../lib/activity'
import type { Engagement, StatusValue } from '../lib/types'
import { StatusBadge } from '../components/StatusBadge'
import { TxStatus, explorerUrl } from '../components/TxStatus'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { IconScale } from '../components/icons'
import { formatGen, formatUnixDate, isPast, shortAddress } from '../lib/format'

const TIMELINE: StatusValue[] = ['created', 'submitted', 'released']

export function EngagementDetail() {
  const { id } = useParams<{ id: string }>()
  const engagementId = Number(id)
  const { address, provider } = useWallet()
  const network = useNetwork()

  const [eng, setEng] = useState<Engagement | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingTx, setPendingTx] = useState<`0x${string}` | null>(null)
  const [lastReleaseTx, setLastReleaseTx] = useState<`0x${string}` | null>(null)
  const [canAppeal, setCanAppeal] = useState(false)

  const refresh = useCallback(async () => {
    if (!Number.isInteger(engagementId) || engagementId <= 0) {
      setLoadError('Invalid engagement id.')
      return
    }
    try {
      const data = await getEngagement(engagementId)
      setEng(data)
      setLoadError(null)
      if (address) markSeen(address, data.id, data.status)
    } catch {
      setLoadError(`Engagement #${engagementId} doesn't exist (or hasn't been indexed yet).`)
    }
    // network is a dependency so switching networks re-fetches against the newly selected contract
  }, [engagementId, address, network])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!lastReleaseTx) return
    withRetry(() => getReadClient().canAppeal({ txId: lastReleaseTx as TransactionHash }))
      .then(setCanAppeal)
      .catch(() => setCanAppeal(false))
  }, [lastReleaseTx])

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    )
  }
  if (!eng) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  const isDepositor = address?.toLowerCase() === eng.depositor.toLowerCase()
  const isCounterparty = address?.toLowerCase() === eng.counterparty.toLowerCase()
  const isParty = isDepositor || isCounterparty

  function onSettled(ok: boolean, opts?: { isRelease?: boolean; hash?: `0x${string}` }) {
    if (ok && opts?.isRelease && opts.hash) setLastReleaseTx(opts.hash)
    if (ok) refresh()
    setPendingTx(null)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Engagement #{eng.id}</h1>
        <StatusBadge status={eng.status} />
      </div>
      <p className="mb-8 whitespace-pre-wrap text-ink-soft">{eng.deliverable_spec}</p>

      <Timeline status={eng.status} />

      <Card className="mt-8 grid grid-cols-2 gap-y-3 p-5 text-sm">
        <dt className="text-ink-soft">Depositor</dt>
        <dd className="font-mono text-ink">{shortAddress(eng.depositor)}</dd>
        <dt className="text-ink-soft">Counterparty</dt>
        <dd className="font-mono text-ink">{shortAddress(eng.counterparty)}</dd>
        <dt className="text-ink-soft">Deposit</dt>
        <dd className="text-ink">{formatGen(eng.amount)}</dd>
        <dt className="text-ink-soft">Deadline</dt>
        <dd className={isPast(eng.deadline) && eng.status === 'created' ? 'text-coral-600' : 'text-ink'}>
          {formatUnixDate(eng.deadline)}
        </dd>
        <dt className="text-ink-soft">Dispute round</dt>
        <dd className="text-ink">{eng.dispute_round}</dd>
      </Card>

      {eng.evidence_urls.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">Evidence</h2>
          <ul className="space-y-1">
            {eng.evidence_urls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-sm text-coral-600 underline hover:text-coral-700">
                  {url}
                </a>
              </li>
            ))}
          </ul>
          {eng.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{eng.notes}</p>}
        </div>
      )}

      {eng.decision_reasoning && (
        <div className="mt-8 rounded-2xl border border-coral-500/20 bg-coral-500/[0.06] p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-coral-600">
            Validator judgment reasoning
          </h2>
          <p className="whitespace-pre-wrap text-sm text-ink">{eng.decision_reasoning}</p>
        </div>
      )}

      {!isParty && address && <p className="mt-8 text-sm text-ink-soft">You are not a party to this engagement.</p>}

      {isCounterparty && provider && (eng.status === 'created' || eng.status === 'submitted') && (
        <SubmitDeliverableForm
          address={address!}
          provider={provider}
          engagementId={eng.id}
          onSubmitting={setPendingTx}
          onSettled={(ok) => onSettled(ok)}
        />
      )}

      {isParty && provider && (eng.status === 'submitted' || eng.status === 'disputed') && (
        <RequestReleaseAction
          onClick={async () => {
            const hash = (await requestRelease(address!, provider, eng.id)) as `0x${string}`
            setPendingTx(hash)
            return hash
          }}
          onSettled={(ok, hash) => onSettled(ok, { isRelease: true, hash })}
        />
      )}

      {isParty && provider && (eng.status === 'rejected' || eng.status === 'released') && (
        <DisputeForm address={address!} provider={provider} engagementId={eng.id} onSettled={(ok) => onSettled(ok)} />
      )}

      {canAppeal && lastReleaseTx && (
        <div className="mt-6 rounded-2xl border border-coral-500/30 bg-coral-500/[0.06] p-5 text-sm">
          <p className="mb-2 text-ink">
            You can also contest the validators&apos; last judgment directly at the protocol level (a bonded appeal
            re-evaluated by a fresh, expanded validator set).
          </p>
          <a href={explorerUrl(lastReleaseTx)} target="_blank" rel="noreferrer" className="text-coral-600 underline hover:text-coral-700">
            View transaction to appeal
          </a>
        </div>
      )}

      {isDepositor && provider && eng.status === 'created' && isPast(eng.deadline) && (
        <ActionButton
          label="Refund (deadline passed)"
          description="No submission was made before the deadline - refund the deposit back to you."
          onClick={async () => {
            const hash = (await refundExpired(address!, provider, eng.id)) as `0x${string}`
            setPendingTx(hash)
            return hash
          }}
          onSettled={(ok) => onSettled(ok)}
        />
      )}

      {pendingTx && (
        <div className="mt-6">
          <TxStatus hash={pendingTx} />
        </div>
      )}
    </div>
  )
}

function Timeline({ status }: { status: StatusValue }) {
  const terminal: StatusValue[] = ['released', 'rejected', 'disputed', 'expired']
  const isTerminal = terminal.includes(status)
  const steps = isTerminal ? [...TIMELINE.slice(0, 2), status] : TIMELINE

  return (
    <ol className="flex flex-wrap items-center gap-y-2 gap-x-2 text-xs">
      {steps.map((step, i) => {
        const reached = TIMELINE.indexOf(status) >= i || (isTerminal && i === steps.length - 1) || (isTerminal && i < 2)
        return (
          <li key={step} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 font-medium ${reached ? 'bg-coral-500 text-black' : 'bg-ink/5 text-ink-soft/70'}`}>
              {step}
            </span>
            {i < steps.length - 1 && <span className="text-ink-soft/50">&rarr;</span>}
          </li>
        )
      })}
    </ol>
  )
}

function ActionButton({
  label,
  description,
  onClick,
  onSettled,
  variant = 'primary',
}: {
  label: string
  description: string
  onClick: () => Promise<`0x${string}`>
  onSettled: (ok: boolean, hash?: `0x${string}`) => void
  variant?: 'primary' | 'secondary'
}) {
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <Card className="mt-6 p-5">
      <p className="mb-3 text-sm text-ink-soft">{description}</p>
      <Button
        variant={variant}
        loading={busy}
        onClick={async () => {
          setBusy(true)
          setError(null)
          try {
            const h = await onClick()
            setHash(h)
          } catch (err: any) {
            setError(err?.message ?? 'Transaction failed')
            setBusy(false)
          }
        }}
      >
        {label}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hash && (
        <div className="mt-3">
          <TxStatus
            hash={hash}
            onSettled={(ok) => {
              setBusy(false)
              onSettled(ok, hash)
            }}
          />
        </div>
      )}
    </Card>
  )
}

function RequestReleaseAction({
  onClick,
  onSettled,
}: {
  onClick: () => Promise<`0x${string}`>
  onSettled: (ok: boolean, hash?: `0x${string}`) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const h = await onClick()
      setHash(h)
      setConfirmOpen(false)
    } catch (err: any) {
      setError(err?.message ?? 'Transaction failed')
      setBusy(false)
    }
  }

  return (
    <Card className="mt-6 p-5">
      <p className="mb-3 text-sm text-ink-soft">
        Triggers validator judgment: they fetch the evidence live and compare it against the spec.
      </p>
      <Button onClick={() => setConfirmOpen(true)}>Request Release</Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hash && (
        <div className="mt-3">
          <TxStatus
            hash={hash}
            onSettled={(ok) => {
              setBusy(false)
              onSettled(ok, hash)
            }}
          />
        </div>
      )}

      <Modal open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)} title="Request validator judgment?">
        <div className="mb-5 flex gap-3 rounded-xl bg-ink/[0.03] p-4 text-sm text-ink-soft">
          <IconScale width={20} height={20} className="mt-0.5 shrink-0 text-coral-500" />
          <p>
            Five independent validators will fetch the submitted evidence live and judge it against the spec. This
            costs gas and cannot be undone once submitted - only a dispute or protocol appeal can revisit the
            outcome.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={run} loading={busy}>
            Confirm &amp; Request Judgment
          </Button>
        </div>
      </Modal>
    </Card>
  )
}

function SubmitDeliverableForm({
  address,
  provider,
  engagementId,
  onSubmitting,
  onSettled,
}: {
  address: `0x${string}`
  provider: EIP1193Provider
  engagementId: number
  onSubmitting: (hash: `0x${string}` | null) => void
  onSettled: (ok: boolean) => void
}) {
  const [urls, setUrls] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <Card className="mt-6 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Submit Deliverable</h2>
      <Textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="Evidence URLs, one per line (repo, live deployment, document...)"
        rows={3}
        className="mb-3"
      />
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes for the reviewer (optional)"
        rows={2}
        className="mb-4"
      />
      <Button
        loading={busy}
        onClick={async () => {
          const evidenceUrls = urls
            .split('\n')
            .map((u) => u.trim())
            .filter(Boolean)
          if (evidenceUrls.length === 0) {
            setError('Add at least one evidence URL.')
            return
          }
          setBusy(true)
          setError(null)
          try {
            const h = (await submitDeliverable(address, provider, engagementId, evidenceUrls, notes)) as `0x${string}`
            setHash(h)
            onSubmitting(h)
          } catch (err: any) {
            setError(err?.message ?? 'Transaction failed')
            setBusy(false)
          }
        }}
      >
        Submit Deliverable
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hash && (
        <div className="mt-3">
          <TxStatus
            hash={hash}
            onSettled={(ok) => {
              setBusy(false)
              onSubmitting(null)
              onSettled(ok)
            }}
          />
        </div>
      )}
    </Card>
  )
}

function DisputeForm({
  address,
  provider,
  engagementId,
  onSettled,
}: {
  address: `0x${string}`
  provider: EIP1193Provider
  engagementId: number
  onSettled: (ok: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [urls, setUrls] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <Button variant="secondary" className="mt-6" onClick={() => setOpen(true)}>
        Dispute this outcome
      </Button>
    )
  }

  return (
    <Card className="mt-6 border-coral-500/30 bg-coral-500/[0.04] p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-coral-600">Raise a dispute</h2>
      <Textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="Additional evidence URLs, one per line (optional)"
        rows={2}
        className="mb-3"
      />
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why do you disagree with this outcome?"
        rows={2}
        className="mb-4"
      />
      <Button
        loading={busy}
        onClick={async () => {
          if (!reason.trim()) {
            setError('A reason is required.')
            return
          }
          const evidenceUrls = urls
            .split('\n')
            .map((u) => u.trim())
            .filter(Boolean)
          setBusy(true)
          setError(null)
          try {
            const h = (await raiseDispute(address, provider, engagementId, evidenceUrls, reason.trim())) as `0x${string}`
            setHash(h)
          } catch (err: any) {
            setError(err?.message ?? 'Transaction failed')
            setBusy(false)
          }
        }}
      >
        Submit Dispute
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hash && (
        <div className="mt-3">
          <TxStatus
            hash={hash}
            onSettled={(ok) => {
              setBusy(false)
              setOpen(false)
              onSettled(ok)
            }}
          />
        </div>
      )}
    </Card>
  )
}
