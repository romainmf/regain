import { chromium } from '@playwright/test'
// Capture de Mon lieu sur grand écran (profil vierge, trois colonnes).
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Passer' }).first().click()
await page.waitForTimeout(1200)
await page.screenshot({ path: 'docs/mon-lieu-bureau.png' })
await browser.close()
console.log('capture écrite : docs/mon-lieu-bureau.png')
