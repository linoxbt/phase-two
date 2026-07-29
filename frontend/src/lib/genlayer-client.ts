import { createClient } from 'genlayer-js'
import { TransactionStatus } from 'genlayer-js/types'
import type { EIP1193Provider } from 'viem'
import { getActiveChain } from './network'

// Read client: talks directly to the GenLayer RPC, no wallet needed. A fresh
// client is created per call so it always targets whichever network is
// currently selected (see lib/network.ts) rather than one fixed at module load.
export function getReadClient() {
  return createClient({ chain: getActiveChain() })
}

// Write client: signs transactions through the wallet connected via Reown
// AppKit (the EIP-1193 provider for whichever wallet the user picked - not
// necessarily MetaMask/window.ethereum, e.g. a mobile wallet over WalletConnect).
export function createWriteClient(account: `0x${string}`, provider: EIP1193Provider) {
  return createClient({
    chain: getActiveChain(),
    account,
    provider,
  })
}

export { TransactionStatus }
export { getContractAddress } from './network'
