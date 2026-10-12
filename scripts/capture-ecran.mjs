import { chromium } from '@playwright/test'
// Capture de Mon île telle qu'un nouvel utilisateur la voit (profil vierge : grand jour).
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Passer' }).first().click()
await page.waitForTimeout(1200)
await page.screenshot({ path: 'docs/mon-ile-jour.png' })
await browser.close()
console.log('capture écrite : docs/mon-ile-jour.png')
