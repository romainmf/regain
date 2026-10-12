import { test, expect } from '@playwright/test'

test('premier parcours : accueil, île, validation, graines', async ({ page }) => {
  await page.goto('/')

  // Accueil : on passe l'onboarding.
  await page.getByRole('button', { name: 'Passer' }).first().click()

  // L'île est là.
  await expect(page.getByRole('img', { name: 'Ton île' })).toBeVisible()

  // Au départ, zéro graine.
  await expect(page.getByLabel('0 graines')).toBeVisible()

  // On ouvre la file et on valide la première proposition.
  await page.getByRole('button', { name: /À valider/ }).click()
  await page.getByRole('button', { name: 'Valider', exact: true }).first().click()

  // Les graines augmentent (10 × élan 1,0).
  await expect(page.getByLabel('10 graines')).toBeVisible({ timeout: 6000 })
})
