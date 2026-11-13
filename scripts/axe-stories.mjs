// Runs axe on every story in a built Storybook and reports violations.
// Usage: npm run build-storybook, then npm run test:stories
// Fails on serious or critical violations, like the e2e axe test.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

const port = 6007
const base = `http://localhost:${port}`
const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8'))
const stories = Object.values(index.entries).filter(e => e.type === 'story')

const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'storybook-static', '--port', String(port), '--strictPort'],
  { stdio: 'ignore' },
)

let failed = 0
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break
    } catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 250))
  }
  const browser = await chromium.launch()
  const page = await (await browser.newContext()).newPage()
  for (const story of stories) {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`)
    await page.locator('#storybook-root > *').first().waitFor()
    await page.waitForTimeout(300)
    const results = await new AxeBuilder({ page }).include('#storybook-root').analyze()
    const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    const other = results.violations.length - serious.length
    if (serious.length) failed++
    console.log(
      `${serious.length ? 'FAIL' : 'pass'}  ${story.id}${other ? `  (${other} minor/moderate)` : ''}` +
        serious.map(v => `\n      ${v.impact}: ${v.id}: ${v.help}`).join(''),
    )
  }
  await browser.close()
} finally {
  server.kill()
}

console.log(`\n${stories.length - failed}/${stories.length} stories have no serious or critical violations.`)
if (failed) process.exit(1)
