import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AboutDialog, README_ABOUT_URL } from './AboutDialog'

describe('AboutDialog', () => {
  it('opens from the trigger, traps focus, closes on Escape, and returns focus', async () => {
    const user = userEvent.setup()
    render(<AboutDialog />)

    const trigger = screen.getByRole('button', { name: 'About this prototype' })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'About this prototype' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    expect(dialog).toHaveTextContent(/all data is mock/i)

    // Tab through more stops than the dialog has. Focus should never leave it.
    for (let i = 0; i < 5; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('links to the README section', async () => {
    const user = userEvent.setup()
    render(<AboutDialog />)
    await user.click(screen.getByRole('button', { name: 'About this prototype' }))

    const link = screen.getByRole('link', { name: /read the full description/i })
    expect(link).toHaveAttribute('href', README_ABOUT_URL)
    expect(README_ABOUT_URL).toMatch(/#what-this-is$/)
  })
})
