import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface ChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
  title?: string
}

export function Chip({ active, onClick, children, count, title }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        'label-micro h-8 border px-3 transition-colors',
        active
          ? 'border-primary bg-primary text-paper'
          : 'border-line text-muted hover:border-primary hover:text-primary',
      )}
    >
      {children}
      {count !== undefined && (
        <span className="ml-2 tabular-nums">{count}</span>
      )}
    </button>
  )
}
