import Dexie, { type Table } from 'dexie'
import type { Autonomie, Domaine } from '../domain/types'

/** Un agent recruté (de départ, du catalogue ou créé par l'utilisateur). */
export interface AgentDB {
  id: string
  templateId?: string
  nom: string
  domaine: Domaine
  missions: string[]
  autonomie: Autonomie
  actif: boolean
  /** Nombre de validations : détermine le niveau du bâtiment. */
  validations: number
  createdAt: number
}

/** Un bâtiment ou un décor posé sur une tuile de l'île. */
export interface PlacementDB {
  id: string
  kind: 'batiment' | 'decor'
  /** refId = id de l'agent (bâtiment) ou id de décor. */
  refId: string
  x: number
  y: number
}

/** Valeurs uniques (élan lissé, réglages, drapeaux de première fois). */
export interface MetaDB {
  cle: string
  valeur: unknown
}

export class RegainDB extends Dexie {
  agents!: Table<AgentDB, string>
  placements!: Table<PlacementDB, string>
  meta!: Table<MetaDB, string>

  constructor() {
    super('regain')
    this.version(1).stores({
      agents: 'id, domaine',
      placements: 'id, refId, kind',
      meta: 'cle',
    })
  }
}

export const db = new RegainDB()

export async function getMeta<T>(cle: string, defaut: T): Promise<T> {
  const row = await db.meta.get(cle)
  return row ? (row.valeur as T) : defaut
}

export async function setMeta(cle: string, valeur: unknown): Promise<void> {
  await db.meta.put({ cle, valeur })
}

/** Identifiant court et lisible pour un agent créé. */
export function nouvelId(prefixe = 'ag'): string {
  return `${prefixe}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}
