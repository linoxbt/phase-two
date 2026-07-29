import type { TransactionHash } from 'genlayer-js/types'
import { getReadClient } from './genlayer-client'
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
  testnetAsimov: '0x750dfa12c4ca17db603ec3115ea7c2629b222480ae0ce0d25e13a68457d768c0',
  studionet: '0x5e38d6dbc86c9b6fa54e3b0721c4101440c19deafceb264d84c394b090843db3',
}

/** Live validator count from a real transaction's consensus round, falling
 * back to the network's documented default if the read fails. */
export async function getRecentValidatorCount(network: NetworkKey): Promise<number> {
  try {
    const tx: any = await getReadClient().getTransaction({ hash: REFERENCE_TX[network] as TransactionHash })
    const validators = tx?.consumedValidators ?? tx?.lastRound?.roundValidators
    if (Array.isArray(validators) && validators.length > 0) return validators.length
  } catch {
    // fall through to the static default below
  }
  return NETWORKS[network].chain.defaultNumberOfInitialValidators
}
