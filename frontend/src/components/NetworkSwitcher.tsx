import { NETWORKS, useNetwork, setCurrentNetwork, type NetworkKey } from '../lib/network'

export function NetworkSwitcher({ className = '' }: { className?: string }) {
  const current = useNetwork()

  return (
    <select
      value={current}
      onChange={(e) => setCurrentNetwork(e.target.value as NetworkKey)}
      title="Network"
      aria-label="Network"
      className={`label-mono w-full cursor-pointer rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-[11px] text-ink outline-none hover:border-ink/30 ${className}`}
    >
      {Object.entries(NETWORKS).map(([key, n]) => (
        <option key={key} value={key}>
          {n.label}
        </option>
      ))}
    </select>
  )
}
