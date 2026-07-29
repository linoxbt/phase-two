import { useWallet } from '../lib/wallet'
import { shortAddress } from '../lib/format'
import { FAUCET_URL } from '../lib/faucet'
import { IconWallet } from './icons'

/** `compact`: icon-only circular button for the collapsed desktop sidebar rail. */
export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, connect } = useWallet()

  if (compact) {
    return (
      <button
        onClick={connect}
        title={address ? shortAddress(address) : 'Connect Wallet'}
        aria-label={address ? shortAddress(address) : 'Connect Wallet'}
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          address ? 'border border-ink/15 bg-paper text-ink hover:border-ink/30' : 'bg-ink text-paper hover:bg-ink/90'
        }`}
      >
        <IconWallet width={18} height={18} />
      </button>
    )
  }

  if (address) {
    return (
      <div className="w-full">
        <button
          onClick={connect}
          className="label-mono w-full rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-[11px] font-mono text-ink hover:border-ink/30"
        >
          {shortAddress(address)}
        </button>
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-center text-xs text-ink-soft hover:text-ink"
        >
          Get testnet GEN
        </a>
      </div>
    )
  }

  return (
    <button
      onClick={connect}
      className="label-mono w-full rounded-full bg-ink px-5 py-2.5 text-[11px] text-paper hover:bg-ink/90"
    >
      Connect Wallet
    </button>
  )
}
