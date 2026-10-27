import { useSyncExternalStore } from 'react'
import type { LieuId } from '../../island/ac/lieux'

/**
 * Le pilote de l'île : ce que l'écran Mon île publie de son état, et les
 * gestes qu'il met à disposition. La visite guidée s'en sert pour attendre
 * que l'on fasse un geste… ou le faire à notre place.
 */
export interface EtatIle {
  vue: 'ile' | 'interieur'
  lieu: LieuId | null
  /** L'agent avec qui l'on parle, s'il y en a un, et ce qu'il a en attente. */
  agentOuvert: string | null
  attenteAgentOuvert: number
  /** Le lieu où le plus de choses attendent, et le nom de l'agent qui s'en occupe. */
  lieuConseille: LieuId | null
  agentConseille: string | null
  tiroirOuvert: boolean
  /** Une transition (porte, iris) est en cours. */
  occupe: boolean
  /** Écran large : trois colonnes, pas de tiroir. */
  large: boolean
}

export interface ActionsIle {
  entrer: (id: LieuId) => void
  sortir: () => void
  /** Aller parler au premier agent du lieu où l'on est. */
  voirAgent: () => void
  ouvrirTiroir: () => void
}

const REPOS: EtatIle = {
  vue: 'ile', lieu: null, agentOuvert: null, attenteAgentOuvert: 0, lieuConseille: null, agentConseille: null,
  tiroirOuvert: false, occupe: false, large: false,
}

let etat: EtatIle = REPOS
let actions: ActionsIle | null = null
const abonnes = new Set<() => void>()

const pareil = (a: EtatIle, b: EtatIle) => (Object.keys(a) as (keyof EtatIle)[]).every((k) => a[k] === b[k])

export function publierEtat(nouveau: EtatIle) {
  if (pareil(etat, nouveau)) return
  etat = nouveau
  if (import.meta.env.DEV) (window as unknown as { __etatIle?: EtatIle }).__etatIle = etat
  abonnes.forEach((f) => f())
}

export function enregistrerActions(a: ActionsIle | null) {
  actions = a
}

export const actionsIle = () => actions

const abonner = (f: () => void) => {
  abonnes.add(f)
  return () => { abonnes.delete(f) }
}

/** L'état courant de l'île, suivi en direct. */
export function useEtatIle(): EtatIle {
  return useSyncExternalStore(abonner, () => etat, () => REPOS)
}
