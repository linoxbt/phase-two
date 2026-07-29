import { parseEther, type EIP1193Provider } from 'viem'
import { getReadClient, createWriteClient, getContractAddress } from './genlayer-client'
import type { Engagement } from './types'

export async function getEngagement(id: number): Promise<Engagement> {
  const result = await getReadClient().readContract({
    address: getContractAddress(),
    functionName: 'get_engagement',
    args: [id],
  })
  return result as unknown as Engagement
}

export async function listEngagementsFor(address: `0x${string}`): Promise<number[]> {
  const result = await getReadClient().readContract({
    address: getContractAddress(),
    functionName: 'list_engagements_for',
    args: [address],
  })
  return (result as unknown as number[]) ?? []
}

export async function listAllIds(): Promise<number[]> {
  const result = await getReadClient().readContract({
    address: getContractAddress(),
    functionName: 'list_all_ids',
    args: [],
  })
  return (result as unknown as number[]) ?? []
}

/** genAmount is a human-readable GEN string, e.g. "0.5" */
export async function createEngagement(
  account: `0x${string}`,
  provider: EIP1193Provider,
  counterparty: `0x${string}`,
  deliverableSpec: string,
  deadlineUnixSeconds: number,
  genAmount: string,
) {
  const client = createWriteClient(account, provider)
  return client.writeContract({
    address: getContractAddress(),
    functionName: 'create_engagement',
    args: [counterparty, deliverableSpec, deadlineUnixSeconds],
    value: parseEther(genAmount),
  })
}

export async function submitDeliverable(
  account: `0x${string}`,
  provider: EIP1193Provider,
  engagementId: number,
  evidenceUrls: string[],
  notes: string,
) {
  const client = createWriteClient(account, provider)
  return client.writeContract({
    address: getContractAddress(),
    functionName: 'submit_deliverable',
    args: [engagementId, evidenceUrls, notes],
    value: 0n,
  })
}

export async function requestRelease(account: `0x${string}`, provider: EIP1193Provider, engagementId: number) {
  const client = createWriteClient(account, provider)
  return client.writeContract({
    address: getContractAddress(),
    functionName: 'request_release',
    args: [engagementId],
    value: 0n,
  })
}

export async function raiseDispute(
  account: `0x${string}`,
  provider: EIP1193Provider,
  engagementId: number,
  additionalEvidence: string[],
  reason: string,
) {
  const client = createWriteClient(account, provider)
  return client.writeContract({
    address: getContractAddress(),
    functionName: 'raise_dispute',
    args: [engagementId, additionalEvidence, reason],
    value: 0n,
  })
}

export async function refundExpired(account: `0x${string}`, provider: EIP1193Provider, engagementId: number) {
  const client = createWriteClient(account, provider)
  return client.writeContract({
    address: getContractAddress(),
    functionName: 'refund_expired',
    args: [engagementId],
    value: 0n,
  })
}
