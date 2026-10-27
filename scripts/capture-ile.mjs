import { chromium } from '@playwright/test'

/** Captures de la maquette « Mon île » façon Animal Crossing : l'île, puis l'intérieur de l'Atelier. */
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 900, height: 940 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5173/maquette-ile', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const cadre = page.locator('.mi-cadre')
await cadre.screenshot({ path: 'docs/maquette-ile-ac.png' })
console.log('capture écrite : docs/maquette-ile-ac.png')

await page.getByRole('button', { name: 'Entrer dans L’Atelier' }).click()
await page.waitForTimeout(2600)
await page.getByRole('button', { name: 'Aller voir Factures' }).click()
await page.waitForTimeout(1400)
await cadre.screenshot({ path: 'docs/maquette-ile-ac-interieur.png' })
console.log('capture écrite : docs/maquette-ile-ac-interieur.png')
await browser.close()
