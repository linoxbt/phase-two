import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'coral' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

// Radius follows the reference site's pattern: primary/coral CTAs are always full
// pills, secondary/ghost/danger stay at an 8px rounded-rect regardless of size.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/90 rounded-full',
  coral: 'bg-coral-500 text-paper hover:bg-coral-600 rounded-full',
  secondary: 'bg-[#dedad4] text-ink hover:bg-[#d3cfc7] rounded-lg',
  ghost: 'text-ink-soft hover:text-ink hover:bg-ink/5 rounded-lg',
  danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-6 py-3 text-xs',
  // Tighter horizontal padding below sm so two lg buttons can sit side by side
  // on a narrow phone width instead of wrapping to separate lines.
  lg: 'px-4 py-3.5 text-[12px] sm:px-7 sm:py-4 sm:text-[13px]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`label-mono inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
      )}
      {!loading && icon}
      {children}
    </button>
  )
}
