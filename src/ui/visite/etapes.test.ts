import { describe, expect, it } from 'vitest'
import { ETAPES, etapesVisibles, type Contexte } from './etapes'
import type { EtatIle } from './pilote'

const surIle: EtatIle = {
  vue: 'ile', lieu: null, agentOuvert: null, attenteAgentOuvert: 0, lieuConseille: null, agentConseille: null,
  tiroirOuvert: false, occupe: false, large: false,
}
const ctx = (etat: Partial<EtatIle> = {}, reste: Partial<Contexte> = {}): Contexte => ({
  etat: { ...surIle, ...etat }, aValider: 3, aValiderAuDepart: 3, route: '/', nbAgents: 3, nbAgentsAuDepart: 3, nouvelAgent: null, prenom: '', ...reste,
})

describe('la visite guidée', () => {
  it('commence par Brin et finit par le retour sur l’île, sans jamais être vide', () => {
    const e = etapesVisibles(ctx())
    expect(e[0].id).toBe('brin')
    expect(e[e.length - 1].id).toBe('retour')
    expect(e.length).toBeGreaterThan(4)
  })

  it('parle du tiroir sur téléphone et des colonnes sur ordinateur', () => {
    const tel = etapesVisibles(ctx({ large: false })).map((e) => e.id)
    const ordi = etapesVisibles(ctx({ large: true })).map((e) => e.id)
    expect(tel).toContain('tiroir')
    expect(tel).not.toContain('colonnes')
    expect(ordi).toContain('colonnes')
    expect(ordi).not.toContain('tiroir')
  })

  it('attend les gestes : entrer, parler, valider, sortir', () => {
    const entrer = ETAPES.find((e) => e.id === 'entrer')!
    expect(entrer.accomplie!(ctx())).toBe(false)
    expect(entrer.accomplie!(ctx({ vue: 'interieur', lieu: 'atelier' }))).toBe(true)

    const agent = ETAPES.find((e) => e.id === 'agent')!
    expect(agent.si!(ctx({ vue: 'interieur', lieu: 'atelier' }))).toBe(true)
    expect(agent.si!(ctx())).toBe(false)
    expect(agent.accomplie!(ctx({ vue: 'interieur', lieu: 'atelier', agentOuvert: 'a1' }))).toBe(true)

    const valider = ETAPES.find((e) => e.id === 'valider')!
    const dedans = ctx({ vue: 'interieur', lieu: 'atelier', agentOuvert: 'a1', attenteAgentOuvert: 1 })
    expect(valider.si!(dedans)).toBe(true)
    expect(valider.si!(ctx({ vue: 'interieur', lieu: 'atelier', agentOuvert: 'a1', attenteAgentOuvert: 0 }))).toBe(false)
    expect(valider.accomplie!(dedans)).toBe(false)
    expect(valider.accomplie!({ ...dedans, aValider: 2 })).toBe(true)

    const sortir = ETAPES.find((e) => e.id === 'sortir')!
    expect(sortir.si!(dedans)).toBe(true)
    expect(sortir.accomplie!(ctx())).toBe(true)
  })

  it('visite le lieu où quelque chose attend, l’Atelier sinon', () => {
    const entrer = ETAPES.find((e) => e.id === 'entrer')!
    const auJardin = ctx({ lieuConseille: 'jardin', agentConseille: 'Empreinte' })
    expect(typeof entrer.cible === 'function' ? entrer.cible(auJardin) : '').toBe('[data-lieu="jardin"]')
    expect(entrer.texte(auJardin)).toMatch(/Le Jardin/)
    expect(entrer.texte(auJardin)).toMatch(/Empreinte/)
    expect(entrer.accomplie!({ ...auJardin, etat: { ...auJardin.etat, vue: 'interieur', lieu: 'jardin' } })).toBe(true)
    expect(entrer.accomplie!({ ...auJardin, etat: { ...auJardin.etat, vue: 'interieur', lieu: 'atelier' } })).toBe(false)
    expect(typeof entrer.cible === 'function' ? entrer.cible(ctx()) : '').toBe('[data-lieu="atelier"]')
  })

  it('garde l’étape en cours même quand sa condition s’éteint', () => {
    const apres = ctx({ vue: 'interieur', lieu: 'spa', agentOuvert: 'a1', attenteAgentOuvert: 0 }, { aValider: 2 })
    expect(etapesVisibles(apres).map((e) => e.id)).not.toContain('valider')
    expect(etapesVisibles(apres, 'valider').map((e) => e.id)).toContain('valider')
  })

  it('emmène créer un agent : l’équipe, le bouton, le formulaire, puis le retour', () => {
    const equipe = ETAPES.find((e) => e.id === 'equipe')!
    expect(equipe.accomplie!(ctx())).toBe(false)
    expect(equipe.accomplie!(ctx({}, { route: '/equipe' }))).toBe(true)
    const creer = ETAPES.find((e) => e.id === 'creer')!
    expect(creer.si!(ctx({}, { route: '/equipe' }))).toBe(true)
    expect(creer.si!(ctx({}, { route: '/creer' }))).toBe(false)
    expect(creer.accomplie!(ctx({}, { route: '/creer' }))).toBe(true)
    const formulaire = ETAPES.find((e) => e.id === 'formulaire')!
    expect(formulaire.libre).toBe(true)
    expect(formulaire.accomplie!(ctx({}, { route: '/creer' }))).toBe(false)
    expect(formulaire.accomplie!(ctx({}, { route: '/', nbAgents: 4 }))).toBe(true)
    const retour = ETAPES.find((e) => e.id === 'retour')!
    expect(retour.texte(ctx({}, { nouvelAgent: { nom: 'Relance', lieu: 'atelier' } }))).toMatch(/Relance s’installe dans L’Atelier/)
    expect(retour.texte(ctx())).toMatch(/Tes agents t’attendent/)
  })

  it('salue par le prénom quand on l’a donné', () => {
    const brin = ETAPES.find((e) => e.id === 'brin')!
    expect(brin.texte(ctx({}, { prenom: 'Romain' }))).toMatch(/^Salut Romain !/)
    expect(brin.texte(ctx())).toMatch(/^Salut !/)
  })
})
