import type { Domaine } from '../types'
import type { Brouillon, Saisie } from '../propositions'

/** Vue minimale d'un agent recruté, suffisante pour le moteur. */
export interface AgentLite {
  id: string
  templateId?: string
  domaine: Domaine
  actif: boolean
}

/** Contexte passé au moteur en plus de la saisie. */
export interface ContexteMoteur {
  agents: AgentLite[]
  /** Grosses journées déclarées sur les 7 derniers jours (saisie courante comprise). */
  grossesJourneesRecentes?: number
  maintenant: number
}

/** Interface du moteur : à partir d'une saisie et du contexte, des propositions. */
export interface AgentEngine {
  propose(saisie: Saisie, ctx: ContexteMoteur): Brouillon[]
}

const STARTER: Record<Domaine, string> = { boite: 'plume', peau: 'source', planete: 'racine' }

/**
 * Choisit l'agent qui portera une proposition : d'abord l'agent du template voulu
 * s'il est recruté et actif, sinon l'agent de départ du domaine, sinon tout agent
 * actif du domaine. Les agents en repos ne préparent rien.
 */
export function choisirAgent(
  agents: AgentLite[],
  template: string | null,
  domaine: Domaine,
): AgentLite | undefined {
  const actifs = agents.filter((a) => a.actif)
  if (template) {
    const exact = actifs.find((a) => a.templateId === template)
    if (exact) return exact
  }
  const starter = actifs.find((a) => a.templateId === STARTER[domaine])
  if (starter) return starter
  return actifs.find((a) => a.domaine === domaine)
}

export function euro(n: number | undefined): string {
  if (n == null) return ''
  return `${Math.round(n)} €`
}
