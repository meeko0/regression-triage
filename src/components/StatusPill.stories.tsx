import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusPill } from './StatusPill'

const meta = {
  title: 'Triage/StatusPill',
  component: StatusPill,
  args: { status: 'open' },
  argTypes: { status: { control: 'inline-radio', options: ['open', 'investigating', 'resolved'] } },
} satisfies Meta<typeof StatusPill>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const Investigating: Story = { args: { status: 'investigating' } }
export const Resolved: Story = { args: { status: 'resolved' } }
