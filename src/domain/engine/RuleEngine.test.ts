import { describe, expect, it } from 'vitest'
import { RuleEngine } from './RuleEngine'
import type { AgentLite } from './AgentEngine'
import type { Saisie } from '../propositions'

const STARTERS: AgentLite[] = [
  { id: 'plume', templateId: 'plume', domaine: 'boite', actif: true },
  { id: 'source', templateId: 'source', domaine: 'peau', actif: true },
  { id: 'racine', templateId: 'racine', domaine: 'planete', actif: true },
]

const saisie = (kind: Saisie['kind'], data: Saisie['data'] = {}): Saisie => ({
  id: 's', kind, data, date: 0,
})

describe('RuleEngine', () => {
  it('une mission terminée fait préparer une facture (boîte) et une empreinte (planète)', () => {
    const props = RuleEngine.propose(saisie('mission_terminee', { client: 'Léa', montant: 800 }), {
      agents: STARTERS, maintenant: 0,
    })
    expect(props.map((p) => p.domaine).sort()).toEqual(['boite', 'planete'])
    const facture = props.find((p) => p.type === 'facture')!
    expect(facture.agentId).toBe('plume')
    expect(facture.titre).toContain('Léa')
    expect(facture.detail).toContain('800')
  })

  it('une grosse journée fait proposer un créneau calme (peau)', () => {
    const props = RuleEngine.propose(saisie('grosse_journee'), { agents: STARTERS, maintenant: 0 })
    expect(props).toHaveLength(1)
    expect(props[0].type).toBe('creneau')
    expect(props[0].agentId).toBe('source')
  })

  it('trois grosses journées ajoutent une régulation si l’agent est recruté', () => {
    const agents = [...STARTERS, { id: 'reg1', templateId: 'regulateur', domaine: 'peau', actif: true } as AgentLite]
    const props = RuleEngine.propose(saisie('grosse_journee'), { agents, maintenant: 0, grossesJourneesRecentes: 3 })
    expect(props.some((p) => p.type === 'regulation')).toBe(true)
  })

  it('un agent en repos ne prépare rien', () => {
    const endormis = STARTERS.map((a) => ({ ...a, actif: false }))
    expect(RuleEngine.propose(saisie('grosse_journee'), { agents: endormis, maintenant: 0 })).toHaveLength(0)
  })

  it('un trajet bas carbone est reconnu comme tel', () => {
    const props = RuleEngine.propose(saisie('trajet', { destination: 'Lyon', basCarbone: true }), {
      agents: STARTERS, maintenant: 0,
    })
    // Déplacements non recruté : repli sur l'agent planète de départ (Racine).
    expect(props[0].type).toBe('trajet_bascarbone')
    expect(props[0].agentId).toBe('racine')
  })
})
