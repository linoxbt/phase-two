import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import type { EIP1193Provider } from 'viem'

export function useWallet() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<EIP1193Provider>('eip155')

  return {
    address: (isConnected ? (address as `0x${string}` | undefined) : undefined) ?? null,
    provider: walletProvider ?? null,
    connect: () => open(),
    disconnect: () => open({ view: 'Account' }),
  }
}
