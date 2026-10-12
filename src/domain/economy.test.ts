import { describe, expect, it } from 'vitest'
import {
  JOUR_MS,
  cleJour,
  cleMois,
  compterRecoltes,
  domaineEnRepos,
  elanCible,
  elanLisse,
  equilibre,
  grainesPourValidation,
  lumiereDepuisElan,
  meteoIle,
} from './economy'

describe('graines', () => {
  it('donne 10 graines de base sans élan', () => {
    expect(grainesPourValidation(0, 1)).toEqual({ gain: 10, plafonne: false })
  })
  it('multiplie par l’élan et arrondit', () => {
    expect(grainesPourValidation(0, 1.4).gain).toBe(14)
    expect(grainesPourValidation(0, 1.25).gain).toBe(13)
  })
  it('applique le plafond de 50 par domaine et par jour', () => {
    expect(grainesPourValidation(45, 1)).toEqual({ gain: 5, plafonne: true })
    expect(grainesPourValidation(50, 1.5)).toEqual({ gain: 0, plafonne: true })
  })
})

describe('élan', () => {
  it('vaut 1,0 avec un seul domaine actif', () => {
    expect(elanCible({ boite: 5, peau: 0, planete: 0 })).toBe(1)
  })
  it('monte avec le nombre de domaines actifs', () => {
    expect(elanCible({ boite: 1, peau: 1, planete: 0 })).toBeCloseTo(1.1, 5)
  })
  it('atteint 1,5 avec trois domaines parfaitement équilibrés', () => {
    expect(elanCible({ boite: 3, peau: 3, planete: 3 })).toBe(1.5)
  })
  it('reste sous 1,5 quand les domaines sont déséquilibrés', () => {
    const e = elanCible({ boite: 10, peau: 1, planete: 1 })
    expect(e).toBeGreaterThan(1.2)
    expect(e).toBeLessThan(1.5)
  })
  it('ne dépasse jamais 1,5', () => {
    expect(elanCible({ boite: 100, peau: 100, planete: 100 })).toBe(1.5)
  })

  it('l’équilibre vaut 0 si un domaine est inactif', () => {
    expect(equilibre({ boite: 5, peau: 5, planete: 0 })).toBe(0)
  })

  it('monte aussitôt vers une cible plus haute', () => {
    expect(elanLisse(1.0, 0, 1.4, JOUR_MS)).toBe(1.4)
  })
  it('ne redescend que de 0,05 par jour', () => {
    // 2 jours écoulés, cible basse : plancher = 1,4 − 0,1 = 1,3
    expect(elanLisse(1.4, 0, 1.0, 2 * JOUR_MS)).toBeCloseTo(1.3, 5)
  })
  it('ne descend jamais sous la cible ni sous 1', () => {
    expect(elanLisse(1.05, 0, 1.0, 100 * JOUR_MS)).toBe(1.0)
  })
})

describe('météo', () => {
  it('est ensoleillée tant qu’aucun domaine ne se repose', () => {
    expect(meteoIle(0)).toBe('soleil')
  })
  it('se voile avec un domaine en repos, brume au-delà', () => {
    expect(meteoIle(1)).toBe('voile')
    expect(meteoIle(2)).toBe('brume')
    expect(meteoIle(3)).toBe('brume')
  })
  it('la lumière du soleil se réchauffe avec l’élan, bornée', () => {
    expect(lumiereDepuisElan(1.0)).toBeCloseTo(0.35, 5)
    expect(lumiereDepuisElan(1.5)).toBeCloseTo(0.7, 5)
    expect(lumiereDepuisElan(3)).toBe(0.7)
  })
})

describe('repos', () => {
  const now = 10 * JOUR_MS
  it('n’est pas en repos sans historique', () => {
    expect(domaineEnRepos(null, now)).toBe(false)
  })
  it('passe en repos après 7 jours sans validation', () => {
    expect(domaineEnRepos(now - 7 * JOUR_MS, now)).toBe(true)
    expect(domaineEnRepos(now - 6 * JOUR_MS, now)).toBe(false)
  })
})

describe('récolte', () => {
  it('compte un mois où les trois domaines atteignent le seuil', () => {
    const parMois = {
      '2026-01': { boite: 4, peau: 5, planete: 6 },
      '2026-02': { boite: 4, peau: 2, planete: 9 }, // peau sous le seuil
    }
    expect(compterRecoltes(parMois as never)).toBe(1)
  })
})

describe('clés de temps', () => {
  it('formate mois et jour', () => {
    const ts = new Date(2026, 2, 7, 12).getTime() // 7 mars 2026
    expect(cleMois(ts)).toBe('2026-03')
    expect(cleJour(ts)).toBe('2026-03-07')
  })
})
