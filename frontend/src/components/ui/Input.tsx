import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const baseClass =
  'w-full rounded-xl border border-ink/12 bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 transition-colors focus:border-coral-500/60 focus:outline-none focus:ring-2 focus:ring-coral-500/15'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(
  ({ className = '', mono = false, ...props }, ref) => (
    <input ref={ref} className={`${baseClass} ${mono ? 'font-mono' : ''} ${className}`} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => <textarea ref={ref} className={`${baseClass} ${className}`} {...props} />,
)
Textarea.displayName = 'Textarea'

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink-soft">{children}</label>
}
