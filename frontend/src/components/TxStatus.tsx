import { useEffect, useState } from 'react'
import type { TransactionHash } from 'genlayer-js/types'
import { getReadClient, TransactionStatus } from '../lib/genlayer-client'
import { getActiveChain } from '../lib/network'

export type TxLifecycle = 'pending' | 'confirming' | 'confirmed' | 'failed'

interface Props {
  hash: `0x${string}` | null
  onSettled?: (ok: boolean) => void
}

const LABEL: Record<TxLifecycle, string> = {
  pending: 'Submitting transaction...',
  confirming: 'Waiting for validator consensus...',
  confirmed: 'Confirmed',
  failed: 'Transaction failed',
}

export function explorerUrl(hash: string): string {
  return `${getActiveChain().blockExplorers?.default.url ?? ''}/tx/${hash}`
}

export function TxStatus({ hash, onSettled }: Props) {
  const [state, setState] = useState<TxLifecycle>('pending')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!hash) return
    let cancelled = false
    setState('confirming')
    setErrorMessage(null)

    getReadClient()
      .waitForTransactionReceipt({
        hash: hash as TransactionHash,
        status: TransactionStatus.ACCEPTED,
        retries: 80,
        interval: 3000,
      })
      .then((receipt: any) => {
        if (cancelled) return
        const succeeded = receipt?.txExecutionResultName !== 'FINISHED_WITH_ERROR'
        setState(succeeded ? 'confirmed' : 'failed')
        if (!succeeded) {
          setErrorMessage('Contract execution reverted - see the transaction in the explorer for details.')
        }
        onSettled?.(succeeded)
      })
      .catch((err: any) => {
        if (cancelled) return
        setState('failed')
        setErrorMessage(err?.message ?? 'Failed to confirm transaction')
        onSettled?.(false)
      })

    return () => {
      cancelled = true
    }
  }, [hash])

  if (!hash) return null

  return (
    <div className="rounded-xl border border-ink/10 bg-cream p-4 text-sm">
      <div className="flex items-center gap-2">
        {(state === 'pending' || state === 'confirming') && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-coral-500 border-t-transparent" />
        )}
        {state === 'confirmed' && <span className="text-emerald-600">&#10003;</span>}
        {state === 'failed' && <span className="text-red-600">&#10007;</span>}
        <span className="font-medium text-ink">{LABEL[state]}</span>
      </div>
      {errorMessage && <p className="mt-1 text-red-600">{errorMessage}</p>}
      <a
        href={explorerUrl(hash)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block truncate font-mono text-xs text-ink-soft underline hover:text-ink"
      >
        {hash}
      </a>
    </div>
  )
}
