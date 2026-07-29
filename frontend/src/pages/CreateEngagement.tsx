import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../lib/wallet'
import { createEngagement, listEngagementsFor } from '../lib/surety'
import { TxStatus } from '../components/TxStatus'
import { Button } from '../components/ui/Button'
import { Input, Textarea, Label } from '../components/ui/Input'
import { EmptyState, EmptyIcon } from '../components/ui/EmptyState'
import { FAUCET_URL } from '../lib/faucet'
import { shortAddress } from '../lib/format'

export function CreateEngagement() {
  const { address, provider, connect } = useWallet()
  const navigate = useNavigate()

  const [counterparty, setCounterparty] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!address || !provider) {
      setFormError('Connect your wallet first.')
      return
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(counterparty)) {
      setFormError('Enter a valid counterparty address (0x...).')
      return
    }
    if (counterparty.toLowerCase() === address.toLowerCase()) {
      setFormError('The counterparty must be a different address than yours.')
      return
    }
    if (!title.trim()) {
      setFormError('Give the engagement a short title.')
      return
    }
    if (!description.trim()) {
      setFormError('Describe exactly what must be delivered.')
      return
    }
    const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000)
    if (!deadline || Number.isNaN(deadlineUnix) || deadlineUnix <= Date.now() / 1000) {
      setFormError('Pick a deadline in the future.')
      return
    }
    if (!amount || Number(amount) <= 0) {
      setFormError('Enter a deposit amount greater than zero.')
      return
    }

    setSubmitting(true)
    try {
      const spec = `${title.trim()}\n\n${description.trim()}`
      const hash = await createEngagement(address, provider, counterparty as `0x${string}`, spec, deadlineUnix, amount)
      setTxHash(hash as `0x${string}`)
    } catch (err: any) {
      setFormError(err?.message ?? 'Failed to submit transaction')
      setSubmitting(false)
    }
  }

  async function handleSettled(ok: boolean) {
    setSubmitting(false)
    if (!ok || !address) return
    try {
      const ids = await listEngagementsFor(address)
      const newestId = Math.max(...ids)
      navigate(`/app/engagement/${newestId}`)
    } catch {
      navigate('/app')
    }
  }

  if (!address) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-24">
        <EmptyState
          icon={<EmptyIcon />}
          title="Connect your wallet"
          description="Connect a wallet to create an engagement."
          action={<Button onClick={connect}>Connect Wallet</Button>}
        />
      </div>
    )
  }

  const validCounterparty = /^0x[a-fA-F0-9]{40}$/.test(counterparty)

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-ink">Create Engagement</h1>
      <p className="mb-8 text-sm text-ink-soft">
        You lock the payment now. It only reaches the counterparty once independent validators confirm the work
        matches what you describe below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Roles, always visible - the thing that was missing: who is who. */}
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-ink/8 bg-paper p-4 sm:grid-cols-2">
          <div>
            <p className="label-mono text-[10px] text-ink-soft/70">Depositor (you)</p>
            <p className="mt-1 truncate font-mono text-sm text-ink">{shortAddress(address)}</p>
            <p className="mt-0.5 text-xs text-ink-soft">Locks the payment now</p>
          </div>
          <div>
            <p className="label-mono text-[10px] text-ink-soft/70">Counterparty</p>
            <p className={`mt-1 truncate font-mono text-sm ${validCounterparty ? 'text-ink' : 'text-ink-soft/50'}`}>
              {validCounterparty ? shortAddress(counterparty) : 'Not set yet'}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">Delivers the work, gets paid on approval</p>
          </div>
        </div>

        <div>
          <Label>Counterparty address</Label>
          <Input
            mono
            type="text"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="0x... - the wallet that will do the work"
          />
        </div>

        <div>
          <Label>Title</Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary, e.g. Landing page redesign"
            maxLength={80}
          />
        </div>

        <div>
          <Label>Deliverable spec</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe exactly what must be delivered and how it will be verified (be as specific as possible - this is what validators judge against)."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Deadline</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <Label>Deposit (GEN)</Label>
            <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.5" />
            <p className="mt-1.5 text-xs text-ink-soft">
              Need testnet GEN?{' '}
              <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="text-coral-600 underline hover:text-coral-700">
                Claim from the faucet
              </a>
              .
            </p>
          </div>
        </div>

        {/* Plain-language summary of what's about to happen, before they sign anything. */}
        {validCounterparty && title.trim() && amount && Number(amount) > 0 && (
          <div className="rounded-2xl border border-coral-500/20 bg-coral-500/[0.05] p-4 text-sm text-ink">
            You will lock <span className="font-semibold">{amount || '0'} GEN</span>. It releases to{' '}
            <span className="font-mono">{shortAddress(counterparty)}</span> only if validators confirm{' '}
            <span className="font-semibold">&ldquo;{title.trim()}&rdquo;</span> is delivered
            {deadline ? (
              <>
                {' '}
                by <span className="font-semibold">{new Date(deadline).toLocaleString()}</span>
              </>
            ) : null}
            . If nothing is submitted by the deadline, it refunds to you automatically.
          </div>
        )}

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <Button type="submit" loading={submitting} size="lg">
          {submitting ? 'Submitting' : 'Create Engagement'}
        </Button>

        {txHash && (
          <div className="pt-2">
            <TxStatus hash={txHash} onSettled={handleSettled} />
          </div>
        )}
      </form>
    </div>
  )
}
