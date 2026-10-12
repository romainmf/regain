import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5173/maquette', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: 'docs/maquette-trois-lieux.png', fullPage: true })
await browser.close()
console.log('capture écrite : docs/maquette-trois-lieux.png')
