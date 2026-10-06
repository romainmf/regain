export type Domaine = 'boite' | 'peau' | 'planete'

export const DOMAINES: Domaine[] = ['boite', 'peau', 'planete']

export const DOMAINE_LABEL: Record<Domaine, string> = {
  boite: 'Ma boîte',
  peau: 'Ma peau',
  planete: 'Ma planète',
}

export type Objectif =
  | 'temps'
  | 'serenite'
  | 'energie'
  | 'empreinte'
  | 'revenu'

export const OBJECTIF_LABEL: Record<Objectif, string> = {
  temps: 'Gagner du temps',
  serenite: 'Être serein',
  energie: 'Préserver mon énergie',
  empreinte: 'Réduire mon empreinte',
  revenu: 'Mieux gagner ma vie',
}

export type Autonomie = 'propose' | 'prepare' | 'relance'

export const AUTONOMIE_LABEL: Record<Autonomie, string> = {
  propose: 'Propose',
  prepare: 'Prépare',
  relance: '+ Relance',
}

export const AUTONOMIE_AIDE: Record<Autonomie, string> = {
  propose: 'Il suggère, tu décides.',
  prepare: 'Il prépare, tu valides.',
  relance: 'Il prépare et relance, toujours après ta validation.',
}

/** Identifiant de dessin d'un bâtiment sur l'île. */
export type BatimentId =
  | 'cabane'
  | 'boite-aux-lettres'
  | 'tour-de-guet'
  | 'pergola'
  | 'lanterne'
  | 'balance'
  | 'sentier'
  | 'banc'
  | 'bassin'
  | 'serre'
  | 'composteur'
  | 'petit-rail'
  | 'echoppe'
  | 'jarre'
  | 'fontaine'
  | 'blason'

export type SigneDeVie = 'lumiere' | 'fumee' | 'plante' | 'train' | 'eau' | 'etincelle'

export interface AgentTemplate {
  id: string
  nom: string
  domaine: Domaine
  objectifs: Objectif[]
  mission: string
  entrees: string[]
  propositions: string[]
  batiment: BatimentId
  batimentNom: string
  signeDeVie: SigneDeVie
  autonomies: Autonomie[]
  relie: { vers: Domaine; produit: string }
  offert?: boolean
}

export interface Tuile {
  x: number
  y: number
  zone: Domaine | 'coeur'
}
