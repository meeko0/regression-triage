import type { ReactNode } from 'react'

interface RegionErrorProps {
  title: string
  children: ReactNode
  actions: ReactNode
}

/** Shared look for a region that failed: says what broke and offers a way out. */
export function RegionError({ title, children, actions }: RegionErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border border-risk-high bg-paper p-6 sm:p-8">
      <p className="font-display text-display-sm font-bold">{title}</p>
      <div className="text-body-sm text-muted">{children}</div>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </div>
  )
}
