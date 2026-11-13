import type { Meta, StoryObj } from '@storybook/react-vite'
import { RiskBar } from './RiskBar'

const meta = {
  title: 'Triage/RiskBar',
  component: RiskBar,
  args: { risk: 82, size: 'sm' },
  argTypes: {
    risk: { control: { type: 'range', min: 0, max: 100 } },
    size: { control: 'inline-radio', options: ['sm', 'lg'] },
  },
} satisfies Meta<typeof RiskBar>

export default meta
type Story = StoryObj<typeof meta>

export const High: Story = { args: { risk: 91 } }
export const Mid: Story = { args: { risk: 55 } }
export const Low: Story = { args: { risk: 18 } }
export const Large: Story = {
  args: { risk: 74, size: 'lg' },
  decorators: [Story => <div className="w-80"><Story /></div>],
}
