import { describe, expect, it } from 'vitest'
import { AMBIANCES, DECORS, EXPANSION, getAmbiance, getDecor } from './boutique'
import { tuilesDeDepart, cle } from '../island/iso'

describe('boutique', () => {
  it('propose l’ambiance jour offerte et des ambiances payantes', () => {
    expect(getAmbiance('jour').prix).toBe(0)
    expect(AMBIANCES.filter((a) => a.prix > 0).length).toBeGreaterThanOrEqual(2)
  })
  it('a des prix de décor entre 20 et 80', () => {
    for (const d of DECORS) {
      expect(d.prix).toBeGreaterThanOrEqual(20)
      expect(d.prix).toBeLessThanOrEqual(80)
      expect(getDecor(d.id)?.id).toBe(d.id)
    }
  })
  it('les tuiles d’agrandissement sont des tuiles de jardin, jamais des pièces', () => {
    const zone = new Map(tuilesDeDepart().map((t) => [cle(t.x, t.y), t.zone]))
    for (const e of EXPANSION) expect(zone.get(cle(e.x, e.y))).toBe('dehors')
    // et sont uniques entre elles
    const vus = new Set(EXPANSION.map((e) => cle(e.x, e.y)))
    expect(vus.size).toBe(EXPANSION.length)
  })
})
