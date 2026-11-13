import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'solid' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-10 items-center gap-2 px-4 text-sm font-medium tracking-tight transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        variant === 'solid'
          ? 'bg-ink text-paper hover:bg-ink/85'
          : 'border border-ink text-ink hover:bg-ink hover:text-paper',
        className,
      )}
      {...props}
    />
  )
})
