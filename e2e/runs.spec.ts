import { expect, test } from '@playwright/test'

test('switching runs updates the run ID, the URL, and resets the selection', async ({ page }) => {
  await page.goto('/')
  const list = page.getByRole('listbox', { name: 'Failures' })
  await expect(list.getByRole('option').first()).toBeVisible()
  await expect(page.getByTestId('run-id')).toHaveText('NIGHTLY-2026-11-12')

  await page.keyboard.press('j')
  await page.keyboard.press('j')
  await expect(list.getByRole('option').nth(2)).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: /^nov 10/i }).click()
  await expect(page.getByTestId('run-id')).toHaveText('NIGHTLY-2026-11-10')
  await expect(page).toHaveURL(/run=NIGHTLY-2026-11-10/)
  await expect(list.getByRole('option')).toHaveCount(52)
  await expect(list.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')

  const failuresStat = page.locator('dt', { hasText: /^Failures$/ }).locator('..')
  await expect(failuresStat).toContainText('52')
})
