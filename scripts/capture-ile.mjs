import { chromium } from '@playwright/test'

/** Captures de la maquette « Mon île » façon Animal Crossing : l'île, le jardin en plein air, le tiroir du tableau de bord. */
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 900, height: 940 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5173/maquette-ile', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const cadre = page.locator('.mi-cadre')
await cadre.screenshot({ path: 'docs/maquette-ile-ac.png' })
console.log('capture écrite : docs/maquette-ile-ac.png')

await page.getByRole('button', { name: 'Entrer dans Le Jardin' }).first().click()
// Le personnage marche, le portillon s'ouvre, l'iris se ferme puis s'ouvre : on attend la fin de la transition.
await page.waitForTimeout(3500)
await page.locator('.mi-iris').waitFor({ state: 'detached', timeout: 10000 })
await page.waitForTimeout(300)
// Le badge « ! » bouge en continu : on clique sans attendre que l'élément soit stable.
await page.getByRole('button', { name: 'Aller voir Empreinte' }).click({ force: true })
await page.waitForTimeout(1400)
await cadre.screenshot({ path: 'docs/maquette-ile-ac-jardin.png' })
console.log('capture écrite : docs/maquette-ile-ac-jardin.png')

await page.getByRole('button', { name: 'Plus tard' }).click()
await page.getByRole('button', { name: '← Sortir' }).click()
await page.waitForTimeout(2000)
// Le tiroir à mi-hauteur : l'île reste visible, le tableau de bord se lit en dessous.
await page.getByRole('button', { name: 'Déplier le tableau de bord' }).click()
await page.waitForTimeout(600)
await cadre.screenshot({ path: 'docs/maquette-ile-ac-tableau.png' })
console.log('capture écrite : docs/maquette-ile-ac-tableau.png')
await browser.close()
