import { JOUR_MS, elanCible, elanLisse, grainesPourValidation } from '../domain/economy'
import { RuleEngine } from '../domain/engine/RuleEngine'
import { LlmEngine } from '../domain/engine/LlmEngine'
import type { AgentLite } from '../domain/engine/AgentEngine'
import { chainesDepuisValidation, type Chaine } from '../domain/chains'
import { optionParLabel } from '../domain/missions'
import type { AmbianceId, DecorId } from '../domain/boutique'
import { PRIX_TUILE, EXPANSION } from '../domain/boutique'
import type { Brouillon, Proposition, Saisie, SaisieData, SaisieKind } from '../domain/propositions'
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
  const moteur = await getMeta<'rule' | 'llm'>('moteur', 'rule')
  const engine = moteur === 'llm' ? LlmEngine : RuleEngine
  const brouillons = await engine.propose(saisie, { agents: agents.map(lite), grossesJourneesRecentes, maintenant: now })
  // Les agents personnalisés (sans template) préparent selon leurs missions cochées.
  const persos = brouillonsPersonnalises(saisie, agents)
  const tous = [...brouillons, ...persos]
  await db.transaction('rw', db.saisies, db.propositions, async () => {
    await db.saisies.add(saisie)
    if (tous.length) await db.propositions.bulkAdd(tous.map((b) => enProposition(b, 'saisie')))
  })
  return tous.length
}

/** Propositions des agents personnalisés actifs dont une mission réagit à la saisie. */
function brouillonsPersonnalises(saisie: Saisie, agents: AgentDB[]): Brouillon[] {
  const out: Brouillon[] = []
  for (const a of agents) {
    if (a.templateId || !a.actif) continue
    for (const label of a.missions) {
      const opt = optionParLabel(a.domaine, label)
      if (opt && opt.kind === saisie.kind) {
        out.push({ agentId: a.id, domaine: a.domaine, type: opt.type, titre: opt.titre(saisie.data.client), detail: opt.detail })
      }
    }
  }
  return out
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

// ——— Boutique (jalon 6) ———

async function soldeActuel(): Promise<number> {
  const journal = await db.graines.toArray()
  return journal.reduce((s, g) => s + g.montant, 0)
}

/** Enregistre une dépense de graines (montant positif à retrancher). */
async function depenser(montant: number, motif = 'depense'): Promise<boolean> {
  const solde = await soldeActuel()
  if (solde < montant) return false
  await db.graines.add({ id: nouvelId('dep'), ts: Date.now(), domaine: 'boite', montant: -montant, motif: motif as GraineDB['motif'] })
  return true
}

/** Achète une ambiance et l'active. Renvoie false si pas assez de graines. */
export async function acheterAmbiance(id: AmbianceId, prix: number): Promise<boolean> {
  const possedees = await getMeta<AmbianceId[]>('ambiances', ['jour'])
  if (!possedees.includes(id)) {
    if (prix > 0 && !(await depenser(prix, 'depense'))) return false
    await setMeta('ambiances', [...possedees, id])
  }
  await setMeta('ambianceActive', id)
  return true
}

export async function activerAmbiance(id: AmbianceId): Promise<void> {
  await setMeta('ambianceActive', id)
}

/** Achète une tuile d'agrandissement (ajoute la prochaine tuile disponible). */
export async function acheterTuile(): Promise<boolean> {
  const n = await getMeta<number>('tuilesAchetees', 0)
  if (n >= EXPANSION.length) return false
  if (!(await depenser(PRIX_TUILE, 'depense'))) return false
  await setMeta('tuilesAchetees', n + 1)
  return true
}

/** Pose un décor acheté sur une tuile libre (dépense à la pose). */
export async function poserDecor(decorId: DecorId, prix: number, x: number, y: number): Promise<boolean> {
  if (!(await depenser(prix, 'depense'))) return false
  await db.placements.add({ id: nouvelId('dec'), kind: 'decor', refId: decorId, x, y })
  return true
}

/** Retire un décor (sans remboursement). */
export async function retirerDecor(placementId: string): Promise<void> {
  await db.placements.delete(placementId)
}
