import { expect, test, type Page } from '@playwright/test'

async function dragHandle(page: Page, steps: number[], pauseMs = 0) {
  const handle = await page.getByTestId('sheet-handle').boundingBox()
  const x = handle!.x + handle!.width / 2
  const y = handle!.y + 12
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (const dy of steps) {
    await page.mouse.move(x, y + dy)
    if (pauseMs) await page.waitForTimeout(pauseMs)
  }
  if (pauseMs) await page.waitForTimeout(150)
  await page.mouse.up()
}

test.describe('mobile detail sheet at 390px', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('opens on tap and closes when dragged down', async ({ page }) => {
    await page.goto('/')
    const list = page.getByRole('listbox', { name: 'Failures' })
    await expect(list.getByRole('option').first()).toBeVisible()
    await expect(page.getByTestId('detail-sheet')).toHaveCount(0)

    const row = list.getByRole('option').nth(1)
    await row.click()
    const sheet = page.getByTestId('detail-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('heading', { level: 2, name: /failure detail/i })).toBeVisible()
    await page.waitForTimeout(500) // let the slide-in finish

    await dragHandle(page, [20, 60, 120, 200, 300])

    await expect(sheet).toBeHidden()
    await expect(row).toBeFocused()
  })

  test('a short, slow drag snaps back open', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('listbox', { name: 'Failures' }).getByRole('option').first().click()
    const sheet = page.getByTestId('detail-sheet')
    await expect(sheet).toBeVisible()
    await page.waitForTimeout(500)

    // Under both the distance and the velocity thresholds.
    await dragHandle(page, [4, 8, 12, 16, 20, 24, 28, 32, 36, 40], 30)

    await page.waitForTimeout(600)
    await expect(sheet).toBeVisible()
  })

  test('closes with the Close button and with Escape', async ({ page }) => {
    await page.goto('/')
    const rows = page.getByRole('listbox', { name: 'Failures' }).getByRole('option')
    await rows.first().click()
    await page.getByTestId('detail-sheet').getByRole('button', { name: 'Close' }).click()
    await expect(page.getByTestId('detail-sheet')).toBeHidden()

    await rows.nth(2).click()
    await expect(page.getByTestId('detail-sheet')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('detail-sheet')).toBeHidden()
  })

  test('with reduced motion, shows the panel inline and scrolls to it', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const rows = page.getByRole('listbox', { name: 'Failures' }).getByRole('option')
    await rows.nth(4).click()

    await expect(page.getByTestId('detail-sheet')).toHaveCount(0)
    await expect(page.getByRole('complementary', { name: 'Failure detail' })).toBeInViewport()
    await context.close()
  })
})
