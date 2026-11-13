import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Mark resolved', onClick: fn() },
  argTypes: { variant: { control: 'inline-radio', options: ['solid', 'outline'] } },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Solid: Story = { args: { variant: 'solid' } }
export const Outline: Story = { args: { variant: 'outline', children: 'Start investigating' } }
export const Disabled: Story = { args: { variant: 'solid', disabled: true } }
