import type { Domaine } from './types'

/** Saisies rapides de l'utilisateur (bêta). */
export type SaisieKind = 'mission_terminee' | 'grosse_journee' | 'trajet' | 'encaissement'

export interface SaisieData {
  client?: string
  montant?: number
  destination?: string
  /** Pour un trajet : l'utilisateur a-t-il choisi l'option bas carbone ? */
  basCarbone?: boolean
  date?: number
}

export interface Saisie {
  id: string
  kind: SaisieKind
  data: SaisieData
  date: number
  exemple?: boolean
}

export const SAISIE_LABEL: Record<SaisieKind, string> = {
  mission_terminee: 'J’ai terminé une mission',
  grosse_journee: 'Grosse journée aujourd’hui',
  trajet: 'Un trajet prévu',
  encaissement: 'J’ai encaissé',
}

export type StatutProposition = 'a_valider' | 'validee' | 'plus_tard'

export interface Proposition {
  id: string
  agentId: string
  domaine: Domaine
  /** Type logique, utilisé par les chaînes (facture, empreinte, créneau…). */
  type: string
  titre: string
  detail?: string
  payload?: Record<string, unknown>
  statut: StatutProposition
  /** D'où vient la proposition : une saisie directe ou une chaîne. */
  origine: 'saisie' | 'chaine'
  /** Proposition qui a déclenché celle-ci (pour les chaînes). */
  chaineDe?: string
  exemple?: boolean
  createdAt: number
  resolvedAt?: number
}

/** Proposition avant enregistrement (le moteur ne gère ni id ni date ni statut). */
export type Brouillon = Pick<Proposition, 'agentId' | 'domaine' | 'type' | 'titre'> &
  Partial<Pick<Proposition, 'detail' | 'payload'>>
