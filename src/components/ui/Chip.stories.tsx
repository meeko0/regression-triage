import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Chip } from './Chip'

const meta = {
  title: 'UI/Chip',
  component: Chip,
  args: { children: 'Interference', active: false, onClick: fn() },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Inactive: Story = {}
export const Active: Story = { args: { active: true } }
export const WithCount: Story = { args: { children: 'Blocking only', count: 7 } }
export const ActiveWithCount: Story = { args: { children: 'All types', count: 48, active: true } }
