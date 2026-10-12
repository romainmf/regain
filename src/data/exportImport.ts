import { db, type AgentDB, type GraineDB, type MetaDB, type PlacementDB } from './db'
import type { Proposition, Saisie } from '../domain/propositions'

export const VERSION_EXPORT = 2

export interface SauvegardeIle {
  app: 'regain'
  version: number
  exporteLe: number
  agents: AgentDB[]
  placements: PlacementDB[]
  saisies: Saisie[]
  propositions: Proposition[]
  graines: GraineDB[]
  meta: MetaDB[]
}

/** Sérialise toute l'île dans un objet JSON. */
export async function exporterIle(): Promise<SauvegardeIle> {
  const [agents, placements, saisies, propositions, graines, meta] = await Promise.all([
    db.agents.toArray(),
    db.placements.toArray(),
    db.saisies.toArray(),
    db.propositions.toArray(),
    db.graines.toArray(),
    db.meta.toArray(),
  ])
  return { app: 'regain', version: VERSION_EXPORT, exporteLe: Date.now(), agents, placements, saisies, propositions, graines, meta }
}

/** Déclenche le téléchargement du fichier d'export. */
export async function telechargerExport(): Promise<void> {
  const data = await exporterIle()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const jour = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `regain-ile-${jour}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function estTableau(x: unknown): x is unknown[] {
  return Array.isArray(x)
}

/** Vérifie qu'un objet a bien la forme d'une sauvegarde Regain. */
export function validerSauvegarde(x: unknown): x is SauvegardeIle {
  if (!x || typeof x !== 'object') return false
  const s = x as Partial<SauvegardeIle>
  if (s.app !== 'regain') return false
  return (
    estTableau(s.agents) &&
    estTableau(s.placements) &&
    estTableau(s.saisies) &&
    estTableau(s.propositions) &&
    estTableau(s.graines) &&
    estTableau(s.meta)
  )
}

/** Remplace entièrement l'île par une sauvegarde importée. */
export async function importerIle(s: SauvegardeIle): Promise<void> {
  await db.transaction('rw', [db.agents, db.placements, db.saisies, db.propositions, db.graines, db.meta], async () => {
    await Promise.all([
      db.agents.clear(),
      db.placements.clear(),
      db.saisies.clear(),
      db.propositions.clear(),
      db.graines.clear(),
      db.meta.clear(),
    ])
    await Promise.all([
      db.agents.bulkAdd(s.agents),
      db.placements.bulkAdd(s.placements),
      db.saisies.bulkAdd(s.saisies),
      db.propositions.bulkAdd(s.propositions),
      db.graines.bulkAdd(s.graines),
      db.meta.bulkAdd(s.meta),
    ])
  })
}

/** Lit un fichier choisi par l'utilisateur et importe l'île. Renvoie une erreur lisible sinon. */
export async function importerDepuisFichier(fichier: File): Promise<void> {
  const texte = await fichier.text()
  let data: unknown
  try {
    data = JSON.parse(texte)
  } catch {
    throw new Error('Ce fichier n’est pas un JSON valide.')
  }
  if (!validerSauvegarde(data)) {
    throw new Error('Ce fichier n’est pas une sauvegarde Regain.')
  }
  await importerIle(data)
}

/** Efface toute l'île (remise à zéro). Le prochain lancement réamorcera les agents offerts. */
export async function toutEffacer(): Promise<void> {
  await db.transaction('rw', [db.agents, db.placements, db.saisies, db.propositions, db.graines, db.meta], async () => {
    await Promise.all([
      db.agents.clear(),
      db.placements.clear(),
      db.saisies.clear(),
      db.propositions.clear(),
      db.graines.clear(),
      db.meta.clear(),
    ])
  })
}
