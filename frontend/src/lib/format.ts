import { formatEther } from 'viem'

export function shortAddress(address: string | null | undefined): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatGen(amount: number | bigint): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(Math.trunc(amount))
  return `${formatEther(value)} GEN`
}

export function formatUnixDate(unixSeconds: number): string {
  if (!unixSeconds) return '-'
  return new Date(unixSeconds * 1000).toLocaleString()
}

export function isPast(unixSeconds: number): boolean {
  return Date.now() >= unixSeconds * 1000
}
