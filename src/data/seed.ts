import { AGENTS_DE_DEPART, getTemplate } from '../domain/catalog'
import type { Proposition } from '../domain/propositions'
import { db, getMeta, setMeta, type AgentDB, type PlacementDB } from './db'

/** Propositions d'exemple, clairement signalées et effaçables, pour découvrir la boucle. */
function propositionsExemple(base: number): Proposition[] {
  const p = (over: Partial<Proposition> & Pick<Proposition, 'agentId' | 'domaine' | 'type' | 'titre'>): Proposition => ({
    id: `exemple_${over.agentId}_${over.type}`,
    statut: 'a_valider',
    origine: 'saisie',
    exemple: true,
    createdAt: base,
    ...over,
  })
  return [
    p({
      agentId: 'plume', domaine: 'boite', type: 'facture',
      titre: 'Brouillon de facture — Atelier Garance',
      detail: '480 €, conforme. À relire avant envoi. (exemple)',
      payload: { client: 'Atelier Garance', montant: 480 },
    }),
    p({
      agentId: 'source', domaine: 'peau', type: 'creneau',
      titre: 'Protège un créneau calme',
      detail: 'Deux grosses journées repérées. Un moment à toi, bientôt ? (exemple)',
    }),
    p({
      agentId: 'racine', domaine: 'planete', type: 'empreinte',
      titre: 'Empreinte de ta semaine',
      detail: 'Estimation à ajouter à ton bilan regen. (exemple)',
    }),
  ]
}

/** Pose de départ des trois agents offerts, dans leur zone respective. */
const POSES_DEPART: Record<string, { x: number; y: number }> = {
  plume: { x: 1, y: 3 },
  source: { x: 4, y: 1 },
  racine: { x: 5, y: 4 },
}

// Garde de session : évite un double amorçage (StrictMode monte l'effet deux fois).
let enCours: Promise<void> | null = null

/** Au tout premier lancement : crée Plume, Source et Racine, déjà posés. */
export function amorcerSiNecessaire(): Promise<void> {
  if (!enCours) enCours = amorcer()
  return enCours
}

async function amorcer(): Promise<void> {
  if (await getMeta('seed-fait', false)) return
  const agents: AgentDB[] = []
  const placements: PlacementDB[] = []
  AGENTS_DE_DEPART.forEach((id, i) => {
    const t = getTemplate(id)!
    agents.push({
      id,
      templateId: id,
      nom: t.nom,
      domaine: t.domaine,
      missions: [...t.propositions],
      autonomie: t.autonomies.includes('prepare') ? 'prepare' : t.autonomies[0],
      actif: true,
      validations: 0,
      createdAt: Date.now() + i,
    })
    const pos = POSES_DEPART[id]
    placements.push({ id: `pl_${id}`, kind: 'batiment', refId: id, x: pos.x, y: pos.y })
  })
  const exemples = propositionsExemple(Date.now())
  await db.transaction('rw', db.agents, db.placements, db.propositions, db.meta, async () => {
    // Re-vérifie dans la transaction : si un autre appel a amorcé entre-temps, on s'arrête.
    if (await getMeta('seed-fait', false)) return
    await db.agents.bulkPut(agents)
    await db.placements.bulkPut(placements)
    await db.propositions.bulkPut(exemples)
    await setMeta('seed-fait', true)
  })
}
