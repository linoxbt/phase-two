import { useNetworkMismatch } from '../lib/networkGuard'

export function NetworkBanner() {
  const { mismatched, switching, targetLabel, switchToCorrectNetwork } = useNetworkMismatch()

  if (!mismatched) return null

  return (
    <div className="border-b border-coral-500/20 bg-coral-500/[0.07] px-4 py-2.5 text-center text-sm text-coral-700 sm:px-6">
      Your wallet is on the wrong network.{' '}
      <button
        type="button"
        onClick={switchToCorrectNetwork}
        disabled={switching}
        className="font-semibold underline underline-offset-2 disabled:opacity-50"
      >
        {switching ? 'Switching...' : `Switch to ${targetLabel}`}
      </button>
    </div>
  )
}
