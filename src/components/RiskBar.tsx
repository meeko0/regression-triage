import { motion } from 'motion/react'
import { riskLevel } from '../lib/triage'
import { cn } from '../lib/utils'

const TRACK_COLOR = {
  high: 'bg-risk-high',
  mid: 'bg-risk-mid',
  low: 'bg-risk-low',
} as const

interface RiskBarProps {
  risk: number
  className?: string
  size?: 'sm' | 'lg'
}

export function RiskBar({ risk, className, size = 'sm' }: RiskBarProps) {
  const level = riskLevel(risk)

  return (
    <div
      role="img"
      aria-label={`Risk ${risk} of 100, ${level}`}
      className={cn('flex items-center gap-3', className)}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-line',
          size === 'lg' ? 'h-[6px] w-full' : 'h-[3px] w-24',
        )}
      >
        <motion.div
          className={cn('absolute inset-y-0 left-0', TRACK_COLOR[level])}
          initial={{ width: 0 }}
          animate={{ width: `${risk}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
      {size === 'sm' && (
        <span className="w-6 text-right text-xs tabular-nums text-muted group-aria-selected:text-paper/75">{risk}</span>
      )}
    </div>
  )
}
