import { expect, test } from '@playwright/test'

test('triages a failure from the list to resolved', async ({ page }) => {
  await page.goto('/')

  const list = page.getByRole('listbox', { name: 'Failures' })
  await expect(list).toBeVisible()

  const firstRow = list.getByRole('option').first()
  await firstRow.click()

  const detail = page.getByRole('complementary', { name: 'Failure detail' })
  await expect(detail).toBeVisible()

  const resolve = detail.getByRole('button', { name: 'Mark resolved' })
  if (await resolve.count()) {
    await resolve.click()
    await expect(detail.getByRole('button', { name: 'Reopen' })).toBeVisible()
  }
})

test('blocking-only filter narrows the list', async ({ page }) => {
  await page.goto('/')
  const list = page.getByRole('listbox', { name: 'Failures' })
  await expect(list.getByRole('option').first()).toBeVisible()

  const total = await list.getByRole('option').count()
  await page.getByRole('button', { name: /Blocking only/ }).click()

  await expect(list.getByRole('option')).not.toHaveCount(total)
})
