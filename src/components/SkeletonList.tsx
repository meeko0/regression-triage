// Placeholder rows shaped like the real ones, shown while a run loads.
// The pulse only runs for users who have not asked for reduced motion.

export function SkeletonList({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading the run" className="border-y border-line">
      <ul aria-hidden="true" className="divide-y divide-line motion-safe:animate-pulse">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            data-testid="skeleton-row"
            className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 px-2 py-4 sm:grid-cols-[3rem_1.4fr_1fr_auto]"
          >
            <span className="h-6 w-8 bg-line" />
            <span className="flex flex-col gap-2">
              <span className="h-4 bg-line" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
              <span className="h-3 w-2/5 bg-line" />
            </span>
            <span className="col-span-2 h-[3px] w-24 bg-line sm:col-span-1" />
            <span className="col-span-2 h-6 w-20 bg-line sm:col-span-1 sm:justify-self-end" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SkeletonCharts() {
  return (
    <div aria-hidden="true" className="grid gap-8 motion-safe:animate-pulse sm:grid-cols-2">
      {[0, 1].map(i => (
        <div key={i} className="flex flex-col gap-3">
          <span className="h-4 w-40 bg-line" />
          <span className="h-32 bg-line/60" />
        </div>
      ))}
    </div>
  )
}
