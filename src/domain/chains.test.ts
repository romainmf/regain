import { describe, expect, it } from 'vitest'
import { chainesDepuisValidation } from './chains'
import type { AgentLite } from './engine/AgentEngine'
import type { Proposition } from './propositions'

const AGENTS: AgentLite[] = [
  { id: 'plume', templateId: 'plume', domaine: 'boite', actif: true },
  { id: 'source', templateId: 'source', domaine: 'peau', actif: true },
  { id: 'racine', templateId: 'racine', domaine: 'planete', actif: true },
]

const prop = (type: string, agentId: string): Proposition => ({
  id: 'p', agentId, domaine: 'boite', type, titre: 't', statut: 'validee', origine: 'saisie', createdAt: 0,
})

describe('chaînes entre domaines', () => {
  it('une facture validée nourrit la peau (coussin) et la planète (empreinte)', () => {
    const r = chainesDepuisValidation(prop('facture', 'plume'), AGENTS)
    const domaines = r.brouillons.map((b) => b.domaine).sort()
    expect(domaines).toContain('planete')
    expect(r.chaines.length).toBeGreaterThanOrEqual(1)
    // Le coussin, non recruté, se replie sur l'agent boîte de départ (Plume = l'émetteur) : évité.
    expect(r.brouillons.every((b) => b.agentId !== 'plume' || b.domaine !== 'boite')).toBe(true)
  })

  it('un trajet bas carbone validé enrichit le label (boîte)', () => {
    const r = chainesDepuisValidation(prop('trajet_bascarbone', 'racine'), AGENTS)
    expect(r.brouillons.some((b) => b.type === 'label' && b.domaine === 'boite')).toBe(true)
    expect(r.chaines[0].libelle).toContain('label')
  })

  it('ne se déclenche pas sur un type sans chaîne', () => {
    expect(chainesDepuisValidation(prop('creneau', 'source'), AGENTS).brouillons).toHaveLength(0)
  })
})
