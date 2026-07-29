/**
 * Icon mark: three independent nodes converging on a center point - the same
 * "multiple validators reach one verdict" idea as the hero/WhyGenLayer graphics,
 * shrunk to a scalable glyph. No bounding tile, no checkmark, no generic badge.
 */
export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 13.5L14 5.5" stroke="#131416" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 13.5L21 17.75" stroke="#131416" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 13.5L7 17.75" stroke="#131416" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="5.5" r="2.75" fill="#FC6432" />
      <circle cx="21" cy="17.75" r="2.75" fill="#765BFF" />
      <circle cx="7" cy="17.75" r="2.75" fill="#FC6432" />
      <circle cx="14" cy="13.5" r="3.25" fill="#131416" />
    </svg>
  )
}

/** Header/footer lockup: icon mark + wordmark, set tight together as one unit. */
export function Logo({ size = 26, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {wordmark && (
        <span className="font-display font-bold tracking-tight text-ink" style={{ fontSize: size * 0.72 }}>
          <span className="text-ink-soft/60">Phase</span>&nbsp;Two
        </span>
      )}
    </span>
  )
}
