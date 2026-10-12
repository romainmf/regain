import { JOUR_MS, elanCible, elanLisse, grainesPourValidation } from '../domain/economy'
import { RuleEngine } from '../domain/engine/RuleEngine'
import type { AgentLite } from '../domain/engine/AgentEngine'
import { chainesDepuisValidation, type Chaine } from '../domain/chains'
import type { Brouillon, Proposition, SaisieData, SaisieKind } from '../domain/propositions'
import { db, getMeta, nouvelId, setMeta, type AgentDB, type GraineDB } from './db'
import { grainesDuJour, validations7j } from './selectors'

const lite = (a: AgentDB): AgentLite => ({ id: a.id, templateId: a.templateId, domaine: a.domaine, actif: a.actif })

const enProposition = (b: Brouillon, origine: Proposition['origine'], chaineDe?: string): Proposition => ({
  id: nouvelId('prop'),
  statut: 'a_valider',
  origine,
  chaineDe,
  createdAt: Date.now(),
  ...b,
})

/** Enregistre une saisie et laisse les agents actifs préparer leurs propositions. */
export async function saisir(kind: SaisieKind, data: SaisieData): Promise<number> {
  const now = Date.now()
  const saisie = { id: nouvelId('sai'), kind, data, date: now }
  const agents = await db.agents.toArray()
  const saisies = await db.saisies.toArray()
  const grossesJourneesRecentes =
    (kind === 'grosse_journee' ? 1 : 0) +
    saisies.filter((s) => s.kind === 'grosse_journee' && now - s.date <= 7 * JOUR_MS).length
  const brouillons = RuleEngine.propose(saisie, { agents: agents.map(lite), grossesJourneesRecentes, maintenant: now })
  await db.transaction('rw', db.saisies, db.propositions, async () => {
    await db.saisies.add(saisie)
    if (brouillons.length) await db.propositions.bulkAdd(brouillons.map((b) => enProposition(b, 'saisie')))
  })
  return brouillons.length
}

export interface ResultatValidation {
  gain: number
  plafonne: boolean
  chaines: Chaine[]
}

/** Valide une proposition : graines, montée de niveau, élan, puis chaînes. */
export async function validerProposition(id: string): Promise<ResultatValidation | null> {
  const now = Date.now()
  let resultat: ResultatValidation | null = null
  await db.transaction('rw', db.propositions, db.agents, db.graines, db.meta, async () => {
    const prop = await db.propositions.get(id)
    if (!prop || prop.statut !== 'a_valider') return
    await db.propositions.update(id, { statut: 'validee', resolvedAt: now })

    const agent = await db.agents.get(prop.agentId)
    if (agent) await db.agents.update(agent.id, { validations: agent.validations + 1 })

    const journal = await db.graines.toArray()
    const elanMemo = await getMeta<{ value: number; ts: number }>('elan', { value: 1, ts: now })
    const v7 = validations7j(journal, now)
    const elan = elanLisse(elanMemo.value, elanMemo.ts, elanCible(v7), now)
    const deja = grainesDuJour(journal, prop.domaine, now)
    const { gain, plafonne } = grainesPourValidation(deja, elan)

    const ligne: GraineDB = { id: nouvelId('gr'), ts: now, domaine: prop.domaine, montant: gain, motif: 'validation' }
    await db.graines.add(ligne)

    // Élan recalculé en incluant cette validation, puis mémorisé (ne redescend jamais d'un coup).
    const v7Apres = validations7j([...journal, ligne], now)
    const elanApres = elanLisse(elanMemo.value, elanMemo.ts, elanCible(v7Apres), now)
    await setMeta('elan', { value: elanApres, ts: now })

    const agents = await db.agents.toArray()
    const { brouillons, chaines } = chainesDepuisValidation(prop, agents.map(lite))
    if (brouillons.length) await db.propositions.bulkAdd(brouillons.map((b) => enProposition(b, 'chaine', id)))
    if (chaines.length) await setMeta('derniereChaine', { chaines, ts: now, propType: prop.type })

    resultat = { gain, plafonne, chaines }
  })
  return resultat
}

export async function plusTard(id: string): Promise<void> {
  await db.propositions.update(id, { statut: 'plus_tard' })
}

export async function revoir(id: string, patch: { titre?: string; detail?: string; payload?: Record<string, unknown> }): Promise<void> {
  await db.propositions.update(id, { ...patch, statut: 'a_valider' })
}

/** Remet une proposition « plus tard » dans la file. */
export async function reprendre(id: string): Promise<void> {
  await db.propositions.update(id, { statut: 'a_valider' })
}

/** Efface les propositions d'exemple chargées au premier lancement. */
export async function effacerExemples(): Promise<void> {
  const exemples = await db.propositions.filter((p) => !!p.exemple).primaryKeys()
  await db.propositions.bulkDelete(exemples)
  await setMeta('exemples-effaces', true)
}
