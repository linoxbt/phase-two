import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { NETWORKS, useNetwork } from './network'

/** True when a connected wallet is on some chain other than the app's
 * currently-selected GenLayer network - the AppKit "add network" prompt is
 * easy to cancel or dismiss, so this is a persistent backstop for that state.
 * Reacts to the in-app network switcher too: picking a different network
 * (see NetworkSwitcher) re-evaluates the mismatch against the new target. */
export function useNetworkMismatch() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const selected = useNetwork()
  const target = NETWORKS[selected]

  const mismatched = isConnected && chainId !== target.chain.id

  return {
    mismatched,
    switching: isPending,
    targetLabel: target.label,
    switchToCorrectNetwork: () => switchChain({ chainId: target.chain.id }),
  }
}
