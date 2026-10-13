import { describe, expect, it } from 'vitest'
import { tuilesDeDepart, cle } from './iso'
import { CATALOGUE, AGENTS_DE_DEPART, getTemplate } from '../domain/catalog'

describe('carte de départ', () => {
  const tuiles = tuilesDeDepart()
  const zoneDe = new Map(tuiles.map((t) => [cle(t.x, t.y), t.zone]))

  it('a trois lieux d’environ 27 tuiles et un Cœur', () => {
    const c = { boite: 0, peau: 0, planete: 0, coeur: 0, dehors: 0 }
    tuiles.forEach((t) => c[t.zone]++)
    expect(c).toEqual({ boite: 27, peau: 28, planete: 25, coeur: 1, dehors: 40 })
  })

  it('place chaque agent de départ dans la zone de son domaine', () => {
    const POSES: Record<string, [number, number]> = { plume: [1, 4], source: [6, 1], racine: [6, 5] }
    for (const id of AGENTS_DE_DEPART) {
      const t = getTemplate(id)!
      const [x, y] = POSES[id]
      expect(zoneDe.get(cle(x, y))).toBe(t.domaine)
    }
  })
})

describe('catalogue', () => {
  it('propose exactement 16 agents aux identifiants uniques', () => {
    expect(CATALOGUE).toHaveLength(16)
    expect(new Set(CATALOGUE.map((a) => a.id)).size).toBe(16)
  })
  it('n’autorise jamais un mode qui agirait sans validation', () => {
    // Les autonomies se limitent à propose/prepare/relance : toutes passent par la validation.
    const ok = new Set(['propose', 'prepare', 'relance'])
    for (const a of CATALOGUE) for (const au of a.autonomies) expect(ok.has(au)).toBe(true)
  })
})
