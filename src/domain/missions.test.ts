import { describe, expect, it } from 'vitest'
import { DOMAINES } from './types'
import { BATIMENT_PERSO, MISSIONS_PAR_DOMAINE, nomSuggere, optionParLabel } from './missions'
import { SAISIE_LABEL } from './propositions'

describe('missions cadrées par domaine', () => {
  it('propose au moins deux missions par domaine', () => {
    for (const d of DOMAINES) expect(MISSIONS_PAR_DOMAINE[d].length).toBeGreaterThanOrEqual(2)
  })
  it('chaque mission réagit à une saisie connue', () => {
    for (const d of DOMAINES)
      for (const m of MISSIONS_PAR_DOMAINE[d]) expect(SAISIE_LABEL[m.kind]).toBeDefined()
  })
  it('retrouve une option par son libellé', () => {
    const m = MISSIONS_PAR_DOMAINE.boite[0]
    expect(optionParLabel('boite', m.label)?.id).toBe(m.id)
    expect(optionParLabel('boite', 'inconnu')).toBeUndefined()
  })
  it('suggère un nom du bon domaine, différent de l’actuel', () => {
    const n = nomSuggere('peau')
    expect(MISSIONS_PAR_DOMAINE.peau).toBeDefined()
    expect(typeof n).toBe('string')
    // 20 tirages : jamais le nom évité
    for (let i = 0; i < 20; i++) expect(nomSuggere('peau', n)).not.toBe(n)
  })
  it('donne un bâtiment personnalisé par domaine', () => {
    for (const d of DOMAINES) expect(BATIMENT_PERSO[d].batiment).toBeTruthy()
  })
})
