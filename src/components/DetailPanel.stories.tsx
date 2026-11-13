import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DetailPanel } from './DetailPanel'
import { MOCK_FAILURES, RUNS } from '../data/mockFailures'

// A high-risk, open, assigned failure from the seeded mock run.
const failure = MOCK_FAILURES.find(f => f.risk >= 70 && f.status === 'open' && f.owner) ?? MOCK_FAILURES[0]

const meta = {
  title: 'Triage/DetailPanel',
  component: DetailPanel,
  args: {
    failure,
    runStart: RUNS[0].start,
    pending: false,
    error: null,
    onStatus: fn(),
    onNote: fn(),
    onAssign: fn(),
    record: {
      note: 'Asked the closure team for the gap target.',
      history: [{ from: 'open', to: 'investigating', at: '2026-11-13T08:40:00.000Z' }],
    },
  },
  decorators: [Story => <div className="max-w-[420px]"><Story /></div>],
} satisfies Meta<typeof DetailPanel>

export default meta
type Story = StoryObj<typeof meta>

/** A failure is selected and ready to triage. */
export const Selected: Story = {}

/** Nothing selected yet, for example right after the filters change. */
export const Empty: Story = { args: { failure: null } }

/** A status change did not save and was rolled back. */
export const SaveFailed: Story = {
  args: { error: 'That change didn’t save. It has been rolled back, so try again.' },
}

/** A change is on its way to the server. Buttons are disabled until it settles. */
export const Saving: Story = { args: { pending: true } }
