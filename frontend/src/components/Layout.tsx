import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { WalletButton } from './WalletButton'
import { Logo, LogoMark } from './Logo'
import { NetworkBanner } from './NetworkBanner'
import { NetworkSwitcher } from './NetworkSwitcher'
import { IconMenu, IconClose, IconHome, IconList, IconPlus, IconBook, IconChartBar, IconSidebar } from './icons'
import { useWallet } from '../lib/wallet'
import { listEngagementsFor, getEngagement } from '../lib/surety'
import { hasUnseenChanges } from '../lib/activity'
import { mapWithConcurrency } from '../lib/concurrency'
import { useNetwork } from '../lib/network'

const ACTIVITY_POLL_MS = 60_000

const NAV_LINKS = [
  { to: '/', label: 'Overview', icon: IconHome },
  { to: '/app', label: 'My Engagements', icon: IconList },
  { to: '/app/create', label: 'Create Engagement', icon: IconPlus },
  { to: '/docs', label: 'Docs', icon: IconBook },
  { to: '/stats', label: 'Transparency', icon: IconChartBar },
]

const COLLAPSE_KEY = 'phasetwo:sidebar-collapsed'

export function Layout() {
  const location = useLocation()
  const { address } = useWallet()
  const network = useNetwork()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasActivity, setHasActivity] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(COLLAPSE_KEY) === '1'
  })

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // "Changed since your last visit" only - purely client-side, no backend to
  // push from, so this polls while the wallet is connected rather than alerting live.
  useEffect(() => {
    if (!address) {
      setHasActivity(false)
      return
    }
    let cancelled = false
    async function check() {
      try {
        const ids = await listEngagementsFor(address!)
        const engagements = await mapWithConcurrency(ids, 1, getEngagement)
        if (!cancelled) setHasActivity(hasUnseenChanges(address!, engagements))
      } catch {
        // network hiccup - next poll retries, no need to surface this as an error
      }
    }
    check()
    const interval = setInterval(check, ACTIVITY_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // network is a dependency so switching networks re-polls against the newly selected contract
  }, [address, network])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="flex min-h-screen bg-cream">
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink/8 bg-paper transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:transition-[width] lg:duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}`}
      >
        <div className={`flex items-center gap-2 px-4 py-5 ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
          <Link to="/">
            {/* Mobile drawer is never collapsed - always show the full lockup there. */}
            <span className="lg:hidden">
              <Logo size={24} />
            </span>
            <span className={collapsed ? 'hidden lg:block' : 'hidden'}>
              <LogoMark size={26} />
            </span>
            <span className={collapsed ? 'hidden' : 'hidden lg:block'}>
              <Logo size={24} />
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink lg:hidden"
          >
            <IconClose width={18} height={18} />
          </button>
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v) => !v)}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink lg:flex"
          >
            <IconSidebar width={18} height={18} />
          </button>
        </div>

        <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2 ${collapsed ? 'lg:items-center lg:px-2' : ''}`}>
          {NAV_LINKS.map((l) => {
            const active = location.pathname === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                title={l.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-ink/5 text-ink' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                } ${collapsed ? 'lg:w-11 lg:justify-center lg:px-0' : ''}`}
              >
                <span className="relative shrink-0">
                  <l.icon width={18} height={18} />
                  {l.to === '/app' && hasActivity && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-coral-500" />
                  )}
                </span>
                <span className={collapsed ? 'lg:hidden' : ''}>{l.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={`border-t border-ink/8 p-3 ${collapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <div className={`space-y-2 ${collapsed ? 'lg:hidden' : ''}`}>
            <NetworkSwitcher />
            <WalletButton />
          </div>
          <div className={`hidden ${collapsed ? 'lg:block' : ''}`}>
            <WalletButton compact />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <NetworkBanner />
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/8 bg-cream/85 px-4 py-4 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink"
          >
            <IconMenu width={20} height={20} />
          </button>
          <Link to="/">
            <Logo size={22} />
          </Link>
          <div className="w-10" />
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
