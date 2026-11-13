import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'storybook-static', '--port', '6008', '--strictPort'], { stdio: 'ignore' })
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://localhost:6008')).ok) break } catch {} await new Promise(r => setTimeout(r, 250)) }
  const browser = await chromium.launch(); const page = await browser.newPage()
  page.on('pageerror', e => console.log('pageerror', e.message.slice(0, 300)))
  page.on('console', m => m.type() === 'error' && console.log('console', m.text().slice(0, 200)))
  await page.goto('http://localhost:6008/iframe.html?id=ui-button--solid&viewMode=story')
  await page.waitForTimeout(4000)
  console.log('root html:', (await page.locator('#storybook-root').innerHTML()).slice(0, 200))
  await browser.close()
} finally { server.kill() }
