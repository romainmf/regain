import { test, expect } from '@playwright/test'

test('premier parcours : accueil, île, validation, graines', async ({ page }) => {
  await page.goto('/')

  // Accueil : on passe l'onboarding.
  await page.getByRole('button', { name: 'Passer' }).first().click()

  // L'île est là.
  await expect(page.getByRole('img', { name: 'Ton île' })).toBeVisible()

  // Au départ, zéro graine.
  await expect(page.getByLabel(/^0 graines/)).toBeVisible()

  // On ouvre Aujourd'hui et on valide la première proposition (une facture).
  await page.getByRole('link', { name: /Aujourd/ }).click()
  await page.getByRole('button', { name: 'Envoyer la facture' }).first().click()

  // Les graines augmentent (10 × élan 1,0) : retour sur Mon lieu pour le voir.
  await expect(page.getByRole('status')).toContainText('+10 graines')
  await page.getByRole('link', { name: 'Mon lieu' }).click()
  await expect(page.getByLabel(/10 graines/)).toBeVisible({ timeout: 6000 })
})
