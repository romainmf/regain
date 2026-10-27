import { chromium } from '@playwright/test'

/** Captures de Mon île dans l'app : l'île, l'Atelier avec un agent qui parle, le tiroir du tableau de bord. */
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Passer' }).first().click()
await page.waitForTimeout(1200)
const cadre = page.locator('.ile-cadre')
await cadre.screenshot({ path: 'docs/mon-ile.png' })
console.log('capture écrite : docs/mon-ile.png')

await page.getByRole('button', { name: 'Entrer dans L’Atelier' }).click()
await page.waitForTimeout(3500)
await page.locator('.ile-iris').waitFor({ state: 'detached', timeout: 10000 })
await page.waitForTimeout(300)
await page.getByRole('button', { name: /^Aller voir / }).first().click({ force: true })
await page.waitForTimeout(1400)
await cadre.screenshot({ path: 'docs/mon-ile-atelier.png' })
console.log('capture écrite : docs/mon-ile-atelier.png')

await page.getByRole('button', { name: 'Fermer' }).click()
await page.getByRole('button', { name: '← Sortir' }).click()
await page.waitForTimeout(2200)
await page.getByRole('button', { name: /Déplier/ }).click()
await page.waitForTimeout(600)
await cadre.screenshot({ path: 'docs/mon-ile-tiroir.png' })
console.log('capture écrite : docs/mon-ile-tiroir.png')
await browser.close()
