import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { OverviewCharts } from './OverviewCharts'
import { MOCK_FAILURES } from '../data/mockFailures'
import { countByGroup, riskHistogram } from '../lib/triage'

describe('OverviewCharts', () => {
  it('gives each chart a text alternative that names the key numbers', () => {
    render(<OverviewCharts failures={MOCK_FAILURES} />)
    const histogram = screen.getByRole('img', { name: /risk histogram/i })
    expect(histogram.getAttribute('aria-label')).toMatch(`${MOCK_FAILURES.length} failures`)

    const groups = screen.getByRole('img', { name: /failures by error group/i })
    const counts = countByGroup(MOCK_FAILURES)
    expect(groups.getAttribute('aria-label')).toContain(`Interference ${counts.Interference}`)
  })

  it('has a table fallback with the exact numbers', () => {
    render(<OverviewCharts failures={MOCK_FAILURES} />)
    const riskTable = screen.getByRole('table', { name: 'Failures by risk bucket' })
    const rows = within(riskTable).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(10)
    const buckets = riskHistogram(MOCK_FAILURES)
    rows.forEach((row, i) => expect(row).toHaveTextContent(new RegExp(`${buckets[i].count}$`)))

    const groupTable = screen.getByRole('table', { name: 'Failures by error group' })
    expect(within(groupTable).getAllByRole('row')).toHaveLength(5)
  })

  it('handles an empty run without dividing by zero', () => {
    render(<OverviewCharts failures={[]} />)
    expect(screen.getByRole('img', { name: /risk histogram of 0 failures/i })).toBeInTheDocument()
  })
})
