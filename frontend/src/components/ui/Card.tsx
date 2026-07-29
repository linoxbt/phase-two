import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  children: ReactNode
}

export function Card({ interactive = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-paper ${
        interactive ? 'transition-all duration-200 hover:border-ink/25 hover:shadow-[0_2px_16px_-4px_rgba(19,20,22,0.12)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
