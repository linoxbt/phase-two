import type { TransactionHash } from 'genlayer-js/types'
import { getReadClient } from './genlayer-client'
import { withRetry } from './retry'
import { NETWORKS, type NetworkKey } from './network'

/**
 * A known-recent transaction per network, used to read the real validator
 * set size for a live consensus round. There's no CORS-enabled way to
 * discover "the latest transaction to this contract" from the browser (the
 * block explorer's API - the only source with that data - doesn't send
 * Access-Control-Allow-Origin, and is unreliable besides: Studio Network's
 * explorer has been down entirely). So this points at a specific real
 * transaction rather than dynamically finding the newest one; update the
 * hash here as fresher reference transactions land.
 */
const REFERENCE_TX: Record<NetworkKey, `0x${string}`> = {
  testnetAsimov: '0xd99ee79a64b89507e8b208b54f8e3a0802ecbc262bde9f989b77d46299712c5f',
  studionet: '0x3740b95921288e710212bde6ce6aa8188c8d41d8743980d0373bc7e767082814',
}

/** Live validator count from a real transaction's consensus round, falling
 * back to the network's documented default if the read fails. */
export async function getRecentValidatorCount(network: NetworkKey): Promise<number> {
  try {
    const tx: any = await withRetry(() => getReadClient().getTransaction({ hash: REFERENCE_TX[network] as TransactionHash }))
    const validators = tx?.consumedValidators ?? tx?.lastRound?.roundValidators
    if (Array.isArray(validators) && validators.length > 0) return validators.length
  } catch {
    // fall through to the static default below
  }
  return NETWORKS[network].chain.defaultNumberOfInitialValidators
}
