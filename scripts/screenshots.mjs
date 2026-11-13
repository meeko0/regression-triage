// Captures the README screenshots into docs/.
// Usage: npm run build, then npm run screenshots. It starts vite preview on port 4174 itself.
//   docs/screenshot-desktop.png        1440px, first screen
//   docs/screenshot-mobile.png         390px, first screen
//   docs/screenshot-mobile-sheet.png   390px, detail open in the bottom sheet
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const port = 4174
const url = `http://localhost:${port}/`

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'], {
  stdio: 'ignore',
})

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error('Preview server did not start')
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'))
  await page.waitForTimeout(600)
}

try {
  await waitForServer()
  const browser = await chromium.launch()

  const shots = [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } },
    { name: 'mobile-sheet', viewport: { width: 390, height: 844 }, openSheet: true },
  ]

  for (const shot of shots) {
    const context = await browser.newContext({ viewport: shot.viewport, deviceScaleFactor: 2 })
    const page = await context.newPage()
    await page.goto(url)
    const rows = page.getByRole('listbox', { name: 'Failures' }).getByRole('option')
    await rows.first().waitFor()
    if (shot.openSheet) {
      await rows.nth(1).click()
      await page.getByTestId('detail-sheet').waitFor()
    }
    await settle(page)
    const path = `docs/screenshot-${shot.name}.png`
    await page.screenshot({ path })
    console.log(`Saved ${path}`)
    await context.close()
  }
  await browser.close()
} finally {
  server.kill()
}
