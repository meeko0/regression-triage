import { cn } from '../lib/utils'

// Paper on crimson is 5.55:1. The word carries the meaning, not the color alone.
export function OverdueBadge({ className }: { className?: string }) {
  return <span className={cn('label-micro shrink-0 bg-risk-high px-1.5 py-0.5 text-paper', className)}>Overdue</span>
}
