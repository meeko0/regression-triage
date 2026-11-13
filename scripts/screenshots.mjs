// Captures desktop (1440px) and mobile (390px) screenshots into docs/.
// Usage: npm run build, then npm run screenshots. It starts vite preview on port 4174 itself.
//   node scripts/screenshots.mjs [suffix]   writes docs/screenshot-desktop[-suffix].png, and so on
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const suffix = process.argv[2] ? `-${process.argv[2]}` : ''
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

try {
  await waitForServer()
  const browser = await chromium.launch()
  const shots = [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, fullPage: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, fullPage: false },
  ]
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: shot.viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' })
    await page.goto(url)
    await page.getByRole('listbox', { name: 'Failures' }).getByRole('option').first().waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(800)
    const path = `docs/screenshot-${shot.name}${suffix}.png`
    await page.screenshot({ path, fullPage: shot.fullPage })
    console.log(`Saved ${path}`)
    await page.close()
  }
  await browser.close()
} finally {
  server.kill()
}
