import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../lib/wallet'
import { createEngagement, listEngagementsFor } from '../lib/surety'
import { TxStatus } from '../components/TxStatus'
import { Button } from '../components/ui/Button'
import { Input, Textarea, Label } from '../components/ui/Input'
import { EmptyState, EmptyIcon } from '../components/ui/EmptyState'
import { FAUCET_URL } from '../lib/faucet'

export function CreateEngagement() {
  const { address, provider, connect } = useWallet()
  const navigate = useNavigate()

  const [counterparty, setCounterparty] = useState('')
  const [spec, setSpec] = useState('')
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
    if (!spec.trim()) {
      setFormError('Describe the deliverable.')
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
      const hash = await createEngagement(
        address,
        provider,
        counterparty as `0x${string}`,
        spec.trim(),
        deadlineUnix,
        amount,
      )
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

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl font-bold tracking-tight text-ink">Create Engagement</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label>Counterparty address</Label>
          <Input mono type="text" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <Label>Deliverable spec</Label>
          <Textarea
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
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
