import { describe, expect, it } from 'vitest'
import { JOUR_MS } from '../domain/economy'
import { derniereValidationParDomaine, grainesDuJour, soldeGraines, validations7j } from './selectors'
import type { GraineDB } from './db'

const now = new Date(2026, 5, 15, 12).getTime()
const j = (over: Partial<GraineDB>): GraineDB => ({
  id: Math.random().toString(), ts: now, domaine: 'boite', montant: 10, motif: 'validation', ...over,
})

describe('sélecteurs d’économie', () => {
  it('somme le solde', () => {
    expect(soldeGraines([j({ montant: 10 }), j({ montant: 14 }), j({ montant: 0 })])).toBe(24)
  })
  it('compte les validations des 7 derniers jours par domaine', () => {
    const v = validations7j([
      j({ domaine: 'boite' }),
      j({ domaine: 'boite', ts: now - 2 * JOUR_MS }),
      j({ domaine: 'peau', ts: now - 10 * JOUR_MS }), // trop vieux
      j({ domaine: 'planete', montant: 0 }), // plafonné mais compte
    ], now)
    expect(v).toEqual({ boite: 2, peau: 0, planete: 1 })
  })
  it('additionne les graines du jour pour le plafond', () => {
    expect(grainesDuJour([j({ montant: 30 }), j({ montant: 15 }), j({ montant: 10, ts: now - JOUR_MS })], 'boite', now)).toBe(45)
  })
  it('trouve la dernière validation par domaine', () => {
    const d = derniereValidationParDomaine([j({ ts: now - 3 * JOUR_MS }), j({ ts: now - JOUR_MS })])
    expect(d.boite).toBe(now - JOUR_MS)
    expect(d.peau).toBeNull()
  })
})
