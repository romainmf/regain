import type { Brouillon, Proposition } from './propositions'
import type { AgentLite } from './engine/AgentEngine'
import { choisirAgent } from './engine/AgentEngine'

/** Une chaîne déclenchée : un agent en nourrit un autre, pour le bandeau et le flux doré. */
export interface Chaine {
  deAgentId: string
  versAgentId: string
  libelle: string
}

export interface ResultatChaine {
  brouillons: Brouillon[]
  chaines: Chaine[]
}

/**
 * Connexions entre domaines (brief, section 6). Quand une proposition est validée,
 * elle peut en déclencher d'autres dans d'autres domaines.
 *  - Facture validée (boîte) → coussin fiscal (peau) + empreinte au bilan (planète).
 *  - Trajet bas carbone validé (planète) → label vivant (boîte).
 */
export function chainesDepuisValidation(prop: Proposition, agents: AgentLite[]): ResultatChaine {
  const brouillons: Brouillon[] = []
  const chaines: Chaine[] = []
  const relier = (template: string | null, domaine: Brouillon['domaine'], b: Omit<Brouillon, 'agentId' | 'domaine'>, libelle: string) => {
    const agent = choisirAgent(agents, template, domaine)
    if (!agent || agent.id === prop.agentId) return
    brouillons.push({ agentId: agent.id, domaine, ...b })
    chaines.push({ deAgentId: prop.agentId, versAgentId: agent.id, libelle })
  }

  switch (prop.type) {
    case 'facture': {
      relier(
        'coussin-fiscal',
        'boite',
        {
          type: 'coussin',
          titre: 'Mets de côté pour tes cotisations',
          detail: 'Facture encaissée bientôt : un coussin pour dormir tranquille.',
        },
        'Facture → coussin fiscal',
      )
      relier(
        'racine',
        'planete',
        {
          type: 'empreinte',
          titre: 'Empreinte de cette facture',
          detail: 'J’ajoute l’impact de cette mission à ton bilan regen.',
        },
        'Facture → bilan planète',
      )
      break
    }
    case 'trajet_bascarbone': {
      relier(
        'label-vivant',
        'boite',
        {
          type: 'label',
          titre: 'Ton label vivant s’enrichit',
          detail: 'Ce trajet doux renforce le badge réutilisable sur tes devis.',
        },
        'Trajet bas carbone → label vivant',
      )
      break
    }
  }

  return { brouillons, chaines }
}
