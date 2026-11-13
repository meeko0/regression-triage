import { useId, useState } from 'react'
import type { ErrorGroup, Failure, RiskLevel } from '../types'
import { BLOCKING_THRESHOLD, countByGroup, riskHistogram } from '../lib/triage'

// Two small charts in plain SVG. Each one has:
//   - an accessible name and a one-sentence summary (role="img" + aria-label)
//   - a screen-reader table with the exact numbers
//   - a hover tooltip on each mark, with a hit area larger than the mark
// Text uses text tokens. Only the marks carry the risk colors.

const LEVEL_FILL: Record<RiskLevel, string> = {
  high: 'var(--color-risk-high)',
  mid: 'var(--color-risk-mid)',
  low: 'var(--color-risk-low)',
}

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'Low, under 40',
  mid: 'Mid, 40 to 69',
  high: 'High, 70 and up',
}

const GROUPS: ErrorGroup[] = ['Interference', 'Constraints', 'Mass', 'References']

const plural = (n: number) => `${n} ${n === 1 ? 'failure' : 'failures'}`

export function OverviewCharts({ failures }: { failures: Failure[] }) {
  return (
    <section aria-label="Run overview" className="grid gap-8 sm:grid-cols-2">
      <RiskHistogram failures={failures} />
      <GroupBreakdown failures={failures} />
    </section>
  )
}

function Tooltip({ text, left }: { text: string; left: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-primary px-2 py-1 text-caption text-paper"
      style={{ left }}
    >
      {text}
    </div>
  )
}

export function RiskHistogram({ failures }: { failures: Failure[] }) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const buckets = riskHistogram(failures)
  const max = Math.max(1, ...buckets.map(b => b.count))

  const width = 300
  const height = 120
  const plotTop = 8
  const plotBottom = height - 20
  const slot = width / buckets.length
  const barWidth = slot - 6
  const scale = (n: number) => ((plotBottom - plotTop) * n) / max
  const peak = buckets.reduce((a, b) => (b.count > a.count ? b : a))
  const high = buckets.filter(b => b.level === 'high').reduce((sum, b) => sum + b.count, 0)
  const summary = `Risk histogram of ${plural(failures.length)} in 10-point buckets. The largest bucket is ${peak.from} to ${peak.to}, with ${plural(peak.count)}. ${plural(high)} score ${BLOCKING_THRESHOLD} or higher.`
  const thresholdX = (BLOCKING_THRESHOLD / 10) * slot

  return (
    <figure className="flex flex-col gap-3" aria-labelledby={`${id}-title`}>
      <figcaption id={`${id}-title`} className="label-display text-muted">
        Risk distribution
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={summary}
          onMouseLeave={() => setHover(null)}
        >
          <line x1={0} x2={width} y1={plotBottom} y2={plotBottom} stroke="var(--color-line)" strokeWidth={1} />
          {buckets.map((b, i) => {
            const h = scale(b.count)
            const x = i * slot + 3
            return (
              <g key={b.from} onMouseEnter={() => setHover(i)}>
                {/* Full-height hit area, wider than the bar. */}
                <rect x={i * slot} y={0} width={slot} height={plotBottom} fill="transparent" />
                {b.count > 0 && (
                  <path
                    d={roundedTop(x, plotBottom - h, barWidth, h, Math.min(4, h))}
                    fill={LEVEL_FILL[b.level]}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {(i % 2 === 0 || i === 9) && (
                  <text
                    x={i === 9 ? i * slot + slot / 2 : i * slot}
                    y={height - 4}
                    textAnchor={i === 0 ? 'start' : 'middle'}
                    className="fill-muted text-[10px]"
                  >
                    {i === 9 ? '90+' : b.from}
                  </text>
                )}
              </g>
            )
          })}
          <line
            x1={thresholdX}
            x2={thresholdX}
            y1={0}
            y2={plotBottom}
            stroke="var(--color-primary)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text x={thresholdX + 4} y={10} className="fill-primary text-[10px]">
            Blocks at {BLOCKING_THRESHOLD}
          </text>
          {peak.count > 0 && (
            <text
              x={buckets.indexOf(peak) * slot + slot / 2}
              y={plotBottom - scale(peak.count) - 4}
              textAnchor="middle"
              className="fill-primary text-[10px] font-medium"
            >
              {peak.count}
            </text>
          )}
        </svg>
        {hover !== null && (
          <Tooltip
            left={`${((hover + 0.5) / buckets.length) * 100}%`}
            text={`Risk ${buckets[hover].from} to ${buckets[hover].to}: ${plural(buckets[hover].count)}`}
          />
        )}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted" aria-hidden="true">
        {(['low', 'mid', 'high'] as const).map(level => (
          <li key={level} className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: LEVEL_FILL[level] }} />
            {LEVEL_LABEL[level]}
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Failures by risk bucket</caption>
        <thead>
          <tr>
            <th scope="col">Risk</th>
            <th scope="col">Level</th>
            <th scope="col">Failures</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map(b => (
            <tr key={b.from}>
              <th scope="row">
                {b.from} to {b.to}
              </th>
              <td>{b.level}</td>
              <td>{b.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export function GroupBreakdown({ failures }: { failures: Failure[] }) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const counts = countByGroup(failures)
  const max = Math.max(1, ...GROUPS.map(g => counts[g]))
  const top = GROUPS.reduce((a, b) => (counts[b] > counts[a] ? b : a))
  const summary = `Failures by error group: ${GROUPS.map(g => `${g} ${counts[g]}`).join(', ')}. ${top} is the largest group.`

  const width = 300
  const labelWidth = 92
  const valueWidth = 28
  const row = 26
  const barHeight = 12
  const height = GROUPS.length * row
  const barSpace = width - labelWidth - valueWidth

  return (
    <figure className="flex flex-col gap-3" aria-labelledby={`${id}-title`}>
      <figcaption id={`${id}-title`} className="label-display text-muted">
        By error group
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          role="img"
          aria-label={summary}
          onMouseLeave={() => setHover(null)}
        >
          {GROUPS.map((g, i) => {
            const y = i * row
            const w = (barSpace * counts[g]) / max
            return (
              <g key={g} onMouseEnter={() => setHover(i)}>
                <rect x={0} y={y} width={width} height={row} fill="transparent" />
                <text x={0} y={y + row / 2 + 4} className="fill-primary text-[11px]">
                  {g}
                </text>
                <rect x={labelWidth} y={y + (row - barHeight) / 2} width={barSpace} height={barHeight} fill="var(--color-line)" />
                {counts[g] > 0 && (
                  <path
                    d={roundedRight(labelWidth, y + (row - barHeight) / 2, w, barHeight, Math.min(4, w))}
                    fill="var(--color-primary)"
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                <text
                  x={width}
                  y={y + row / 2 + 4}
                  textAnchor="end"
                  className="fill-primary text-[11px] font-medium tabular-nums"
                >
                  {counts[g]}
                </text>
              </g>
            )
          })}
        </svg>
        {hover !== null && (
          <Tooltip
            left={`${((labelWidth + barSpace / 2) / width) * 100}%`}
            text={`${GROUPS[hover]}: ${plural(counts[GROUPS[hover]])}, ${Math.round((counts[GROUPS[hover]] / Math.max(1, failures.length)) * 100)}% of the run`}
          />
        )}
      </div>

      <table className="sr-only">
        <caption>Failures by error group</caption>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">Failures</th>
          </tr>
        </thead>
        <tbody>
          {GROUPS.map(g => (
            <tr key={g}>
              <th scope="row">{g}</th>
              <td>{counts[g]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

// A bar rising from the baseline with only its top corners rounded.
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}

// A bar growing right from the axis with only its end corners rounded.
function roundedRight(x: number, y: number, w: number, h: number, r: number) {
  return `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`
}
