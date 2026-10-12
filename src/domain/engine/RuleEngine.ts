import type { Brouillon, Saisie } from '../propositions'
import type { AgentEngine, ContexteMoteur } from './AgentEngine'
import { choisirAgent, euro } from './AgentEngine'

/** Part mise de côté pour les cotisations (ordre de grandeur micro-entreprise). */
const TAUX_COUSSIN = 0.24

/**
 * Moteur déterministe, sans réseau. À partir d'une saisie, il fait préparer
 * des propositions par les agents actifs concernés.
 */
export const RuleEngine: AgentEngine = {
  propose(saisie: Saisie, ctx: ContexteMoteur): Brouillon[] {
    const { agents } = ctx
    const out: Brouillon[] = []
    const ajouter = (template: string | null, domaine: Brouillon['domaine'], b: Omit<Brouillon, 'agentId' | 'domaine'>) => {
      const agent = choisirAgent(agents, template, domaine)
      if (agent) out.push({ agentId: agent.id, domaine, ...b })
    }
    const { data } = saisie

    switch (saisie.kind) {
      case 'mission_terminee': {
        const client = data.client?.trim() || 'ton client'
        ajouter('plume', 'boite', {
          type: 'facture',
          titre: `Brouillon de facture : ${client}`,
          detail: data.montant ? `${euro(data.montant)}, conforme. À relire avant envoi.` : 'Facture conforme à relire.',
          payload: { client, montant: data.montant },
        })
        ajouter('racine', 'planete', {
          type: 'empreinte',
          titre: `Empreinte de la mission ${client}`,
          detail: 'Estimation (déplacements, matériel, numérique) à ajouter à ton bilan.',
          payload: { client },
        })
        break
      }
      case 'encaissement': {
        ajouter('coussin-fiscal', 'boite', {
          type: 'coussin',
          titre: 'Mets de côté pour tes cotisations',
          detail: data.montant
            ? `Environ ${euro(data.montant * TAUX_COUSSIN)} à réserver sur cet encaissement.`
            : 'Une part à réserver pour tes cotisations.',
          payload: { montant: data.montant, taux: TAUX_COUSSIN },
        })
        break
      }
      case 'grosse_journee': {
        ajouter('source', 'peau', {
          type: 'creneau',
          titre: 'Protège un créneau calme',
          detail: 'Un moment à toi, bientôt, pour souffler.',
        })
        if ((ctx.grossesJourneesRecentes ?? 0) >= 3) {
          ajouter('regulateur', 'peau', {
            type: 'regulation',
            titre: 'Semaine chargée repérée',
            detail: 'Je peux préparer un message pour décaler une échéance.',
          })
        }
        break
      }
      case 'trajet': {
        const dest = data.destination?.trim()
        if (data.basCarbone) {
          ajouter('deplacements', 'planete', {
            type: 'trajet_bascarbone',
            titre: dest ? `Trajet bas carbone vers ${dest}` : 'Trajet bas carbone',
            detail: 'Beau choix. Je l’ajoute à ton bilan regen.',
            payload: { destination: dest, basCarbone: true },
          })
        } else {
          ajouter('deplacements', 'planete', {
            type: 'trajet_option',
            titre: dest ? `Option bas carbone vers ${dest}` : 'Option bas carbone',
            detail: 'Une alternative plus douce pour ce trajet.',
            payload: { destination: dest },
          })
        }
        break
      }
    }
    return out
  },
}
