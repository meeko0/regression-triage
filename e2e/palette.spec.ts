import { expect, test } from '@playwright/test'

test.describe('command palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listbox', { name: 'Failures' }).getByRole('option').first()).toBeVisible()
  })

  test('jumps to a failure with Ctrl+K, search, and Enter', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /jump to/i })
    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog', { name: 'Command palette' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('combobox')).toBeFocused()

    await page.keyboard.type('RT-030')
    await expect(dialog.getByRole('option').first()).toContainText('RT-030')
    await page.keyboard.press('Enter')

    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(page).toHaveURL(/id=RT-030/)
    await expect(page.getByRole('complementary', { name: 'Failure detail' })).toContainText('RT-030')
  })

  test('moves with arrow keys and changes a filter', async ({ page }) => {
    await page.getByRole('button', { name: /jump to/i }).click()
    const dialog = page.getByRole('dialog', { name: 'Command palette' })
    await page.keyboard.type('show only')
    const options = dialog.getByRole('option')
    await expect(options.first()).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowDown')
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true')
    const label = await options.nth(1).textContent()
    await page.keyboard.press('Enter')

    await expect(dialog).toBeHidden()
    // "Show only Constraints" -> group=Constraints, "Show only Open" -> status=open
    const value = label!.replace('Show only ', '').trim()
    await expect(page).toHaveURL(new RegExp(`=${value}(&|$)`, 'i'))
  })

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /jump to/i })
    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})
