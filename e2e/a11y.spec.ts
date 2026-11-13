import { expect, test, type Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

// Fails on any serious or critical axe violation. Minor and moderate ones are printed but do not fail.
async function expectNoSeriousViolations(page: Page, include?: string) {
  // Let enter animations finish. Mid-fade text is partly transparent and would read as low contrast.
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'))
  await page.waitForTimeout(400)
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  if (include) builder = builder.include(include)
  const { violations } = await builder.analyze()
  const blocking = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  for (const v of violations) {
    console.log(`${v.impact}: ${v.id} (${v.nodes.length}) ${v.help}`)
  }
  expect(blocking.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

test.describe('accessibility', () => {
  test('main view has no serious or critical violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listbox', { name: 'Failures' }).getByRole('option').first()).toBeVisible()
    await expectNoSeriousViolations(page)
  })

  test('detail panel has no serious or critical violations', async ({ page }) => {
    await page.goto('/')
    const list = page.getByRole('listbox', { name: 'Failures' })
    await list.getByRole('option').nth(3).click()
    const detail = page.getByRole('complementary', { name: 'Failure detail' })
    await expect(detail.getByRole('heading', { level: 2 })).toBeVisible()
    await expectNoSeriousViolations(page, '#failure-detail')
  })

  test('command palette has no serious or critical violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('listbox', { name: 'Failures' }).getByRole('option').first()).toBeVisible()
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill('mass')
    await expectNoSeriousViolations(page, '[role="dialog"]')
  })

  test('mobile bottom sheet has no serious or critical violations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('listbox', { name: 'Failures' }).getByRole('option').first().click()
    await expect(page.getByTestId('detail-sheet')).toBeVisible()
    await page.waitForTimeout(500) // let the slide-in finish
    await expectNoSeriousViolations(page, '[data-testid="detail-sheet"]')
  })
})
