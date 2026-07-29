import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { IconArrowRight } from '../components/icons'

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start px-6 py-24 text-left">
      <p className="label-mono text-xs text-coral-600">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-md text-ink-soft">
        Nothing lives at this address. Double-check the link, or head back to your engagements.
      </p>
      <Link to="/app" className="mt-8">
        <Button icon={<IconArrowRight width={16} height={16} />}>Back to My Engagements</Button>
      </Link>
    </div>
  )
}
