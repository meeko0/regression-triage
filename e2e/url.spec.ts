import { expect, test } from '@playwright/test'

test.describe('URL sync', () => {
  test('opens the view described by a shared link', async ({ page }) => {
    await page.goto('/?group=Mass&status=open&sort=newest&id=RT-015')
    const list = page.getByRole('listbox', { name: 'Failures' })
    await expect(list.getByRole('option').first()).toBeVisible()

    await expect(page.getByRole('button', { name: /^mass/i })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /^open$/i })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /^newest/i })).toHaveAttribute('aria-pressed', 'true')
    await expect(list.getByRole('option', { selected: true })).toContainText('Mass')
  })

  test('writes filter changes to the URL, survives reload, and Back undoes them', async ({ page }) => {
    await page.goto('/')
    const list = page.getByRole('listbox', { name: 'Failures' })
    await expect(list.getByRole('option').first()).toBeVisible()

    await page.getByRole('button', { name: /^constraints/i }).click()
    await expect(page).toHaveURL(/group=Constraints/)
    await page.getByRole('button', { name: /^blocking only/i }).click()
    await expect(page).toHaveURL(/group=Constraints.*blocking=1/)

    await page.reload()
    await expect(page.getByRole('button', { name: /^blocking only/i })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /^constraints/i })).toHaveAttribute('aria-pressed', 'true')

    await page.goBack()
    await expect(page).not.toHaveURL(/blocking=1/)
    await expect(page.getByRole('button', { name: /^blocking only/i })).toHaveAttribute('aria-pressed', 'false')
  })

  test('selection changes replace the history entry instead of adding one', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listbox', { name: 'Failures' }).getByRole('option').first()).toBeVisible()
    const before = await page.evaluate(() => history.length)
    await page.keyboard.press('j')
    await page.keyboard.press('j')
    await expect(page).toHaveURL(/id=RT-/)
    expect(await page.evaluate(() => history.length)).toBe(before)
  })
})
